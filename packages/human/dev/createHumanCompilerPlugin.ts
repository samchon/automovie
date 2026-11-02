import { type ChildProcess, fork } from "node:child_process";
import type { IncomingMessage, ServerResponse } from "node:http";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import type { Plugin, ViteDevServer } from "vite";

/** Keep the native incremental checker alive and expose its current verdict.
 * The bundler adapter transforms plugin-dependent files; the companion checker
 * catches ordinary type errors at edit time as well. Its IPC stop protocol joins
 * the original compiler owner instead of terminating a PID or process family.
 */
export function createHumanCompilerPlugin(
  directory: string,
  fingerprint: () => Promise<string>,
): createHumanCompilerPlugin.IOwner {
  let child: ChildProcess | undefined;
  let closing: Promise<void> | undefined;
  let state: {
    phase: "checking" | "passed" | "failed";
    output: string;
    sequence: number;
  } = {
    phase: "checking",
    output: "",
    sequence: 0,
  };
  let pending: string = "";
  let completed: number = 0;
  let checkedSource: string | undefined;
  let cycleSource: Promise<string> | undefined;
  let terminal: boolean = false;
  let next: number = 0;
  const settlements: Map<
    string,
    { resolve: (builds: number) => void; reject: (error: Error) => void }
  > = new Map();

  /** Reject admission and every outstanding freshness barrier after owner loss. */
  function fail(message: string): void {
    terminal = true;
    checkedSource = undefined;
    state = { phase: "failed", output: message, sequence: state.sequence };
    for (const value of settlements.values()) value.reject(new Error(message));
    settlements.clear();
  }

  /** Join native pending edits, then drain its separately delivered stdout markers. */
  async function settle(): Promise<void> {
    const owned: ChildProcess | undefined = child;
    if (owned === undefined || !owned.connected || settlements.size >= 32)
      throw new Error("Human compiler freshness owner is unavailable or busy");
    const id: string = "human-admit-" + ++next;
    const builds: number = await new Promise<number>(
      (
        resolve: (builds: number) => void,
        reject: (error: Error) => void,
      ): void => {
        const timer: ReturnType<typeof setTimeout> = setTimeout((): void => {
          settlements.delete(id);
          reject(new Error("Human compiler freshness barrier timed out"));
        }, 30000);
        settlements.set(id, {
          resolve: (value: number): void => {
            clearTimeout(timer);
            resolve(value);
          },
          reject: (error: Error): void => {
            clearTimeout(timer);
            reject(error);
          },
        });
        owned.send(
          { type: "ttsc.watch.settle", id },
          (error: Error | null): void => {
            if (error !== null) {
              settlements.get(id)?.reject(error);
              settlements.delete(id);
            }
          },
        );
      },
    );
    const started: number = Date.now();
    while (completed < builds) {
      if (Date.now() - started > 5000 || child !== owned || !owned.connected)
        throw new Error("Human compiler completion stream did not settle");
      await new Promise<undefined>(
        (resolve: (value: undefined) => void): void => {
          setTimeout(resolve, 10, undefined);
        },
      );
    }
    if (state.phase !== "passed" || completed !== builds)
      throw new Error(
        "Human compiler is checking, failed or newer than its settled verdict",
      );
  }

  /** Bind the settled full-check verdict to identical current source bytes. */
  async function requirePassed(): Promise<string> {
    const checked: string | undefined = checkedSource;
    if (state.phase !== "passed" || checked === undefined || terminal)
      throw new Error("Human compiler has no current passing verdict");
    const before: string = await fingerprint();
    if (before !== checked)
      throw new Error("Human source differs from the checked passing verdict");
    await settle();
    const after: string = await fingerprint();
    if (
      before !== after ||
      after !== checked ||
      checkedSource !== checked ||
      state.phase !== "passed" ||
      terminal
    )
      throw new Error("Human source changed across compiler admission");
    return after;
  }

  /** Publish a detached current verdict to connected review pages. */
  function publish(server: ViteDevServer): void {
    server.ws.send({ type: "custom", event: "human:compiler", data: state });
  }

  /** Join the checker after asking its own watch owner to release resources. */
  function close(): Promise<void> {
    if (closing !== undefined) return closing;
    const owned: ChildProcess | undefined = child;
    closing =
      owned === undefined
        ? Promise.resolve()
        : new Promise<undefined>(
            (resolve: (value: undefined) => void): void => {
              if (owned.exitCode !== null || owned.signalCode !== null) {
                resolve(undefined);
                return;
              }
              owned.once("close", (): void => {
                child = undefined;
                resolve(undefined);
              });
              if (owned.connected)
                owned.send({
                  type: "ttsc.watch.stop",
                  id: "human-local-viewer-close",
                });
            },
          );
    return closing;
  }

  const plugin: Plugin = {
    name: "automovie-human-incremental-checker",
    apply: "serve",
    async configureServer(server: ViteDevServer): Promise<void> {
      cycleSource = Promise.resolve(await fingerprint());
      const require: NodeJS.Require = createRequire(
        resolve(directory, "package.json"),
      );
      const launcher: string = resolve(
        dirname(require.resolve("ttsc/package.json")),
        "lib/launcher/ttsc.js",
      );
      child = fork(
        launcher,
        [
          "--noEmit",
          "--watch",
          "--preserveWatchOutput",
          "--pretty",
          "false",
          "-p",
          resolve(directory, "tsconfig.json"),
        ],
        {
          cwd: directory,
          execArgv: [],
          stdio: ["ignore", "pipe", "pipe", "ipc"],
        },
      );

      /** Consume complete ordered checker lines, bounding retained diagnostics. */
      const observe: (chunk: Buffer) => void = (chunk: Buffer): void => {
        pending += chunk.toString();
        const lines: string[] = pending.split(/\r?\n/);
        pending = lines.pop() ?? "";
        for (const raw of lines) {
          const line: string = raw.replace(/\x1b\[[0-9;]*m/g, "");
          if (line.startsWith("[ttsc] rebuilding")) {
            state = {
              phase: "checking",
              output: "",
              sequence: state.sequence + 1,
            };
            checkedSource = undefined;
            cycleSource = fingerprint();
          } else if (line === "[ttsc] watch build complete") {
            ++completed;
            const sequence: number = state.sequence;
            const start: Promise<string> | undefined = cycleSource;
            void Promise.resolve(start)
              .then(async (before: string | undefined): Promise<void> => {
                const after: string = await fingerprint();
                if (sequence !== state.sequence || terminal) return;
                if (before !== after) {
                  state.phase = "failed";
                  state.output =
                    "Human source changed across the completed compiler cycle";
                } else {
                  checkedSource = after;
                  state.phase = "passed";
                }
                publish(server);
              })
              .catch((error: unknown): void => {
                fail(String(error));
                publish(server);
              });
          } else if (line === "[ttsc] watch build failed") {
            checkedSource = undefined;
            state.phase = "failed";
            ++completed;
          } else if (line.startsWith("[ttsc] watch error")) fail(line);
          else state.output = (state.output + line + "\n").slice(-131072);
          if (line.startsWith("[ttsc]")) publish(server);
        }
      };
      child.stdout?.on("data", observe);
      child.stderr?.on("data", observe);
      child.on("message", (message: unknown): void => {
        if (
          message === null ||
          typeof message !== "object" ||
          !("type" in message) ||
          message.type !== "ttsc.watch.settled" ||
          !("id" in message) ||
          typeof message.id !== "string" ||
          !("builds" in message) ||
          typeof message.builds !== "number"
        )
          return;
        settlements.get(message.id)?.resolve(message.builds);
        settlements.delete(message.id);
      });
      child.once("error", (error: Error): void => {
        fail(error.message);
        publish(server);
      });
      child.once("disconnect", (): void => {
        fail("Human compiler owner disconnected");
        publish(server);
      });
      child.once("close", (): void => {
        fail("Human compiler owner closed");
        publish(server);
      });
      server.middlewares.use(
        "/__human/compiler",
        (_request: IncomingMessage, response: ServerResponse): void => {
          response.setHeader("content-type", "application/json");
          response.setHeader("cache-control", "no-store");
          if (
            _request.url?.startsWith("/close") &&
            _request.method === "POST"
          ) {
            void close()
              .then((): void => {
                response.end(JSON.stringify({ ...state, closed: true }));
              })
              .catch((error: unknown): void => {
                response.statusCode = 500;
                response.end(JSON.stringify({ error: String(error) }));
              });
          } else if (
            _request.url?.startsWith("/restart") &&
            _request.method === "POST"
          ) {
            response.end(JSON.stringify({ restarting: true }));
            void server.restart();
          } else if (_request.url?.startsWith("/admit")) {
            void requirePassed()
              .then((sourceSha256: string): void => {
                response.end(
                  JSON.stringify({ ...state, sourceSha256, builds: completed }),
                );
              })
              .catch((error: unknown): void => {
                response.statusCode = 409;
                response.end(
                  JSON.stringify({
                    ...state,
                    error:
                      error instanceof Error ? error.message : String(error),
                  }),
                );
              });
          } else
            response.end(
              JSON.stringify({
                ...state,
                builds: completed,
                checkedSourceSha256: checkedSource,
              }),
            );
        },
      );
    },
    closeBundle: close,
  };
  return { plugin, requirePassed };
}

/** The checker plugin and its current-source generation/capture admission gate. */
export namespace createHumanCompilerPlugin {
  /** Borrowed gate shares the one native checker rather than starting another check. */
  export interface IOwner {
    /** Vite owns this plugin's checker lifetime. */
    plugin: Plugin;
    /** Reject unless native pending edits settle to a passing current-source verdict. */
    requirePassed: () => Promise<string>;
  }
}
