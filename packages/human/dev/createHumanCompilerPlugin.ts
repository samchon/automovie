import { type ChildProcess, fork } from "node:child_process";
import type { IncomingMessage, ServerResponse } from "node:http";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import type { Plugin, ViteDevServer } from "vite";

/** Keep the native incremental checker alive and report its current cycle.
 * The checker is advisory: its verdict never admits or blocks generation and
 * capture, which proceed whatever the check state. Its IPC stop protocol joins
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

  /** Record checker loss in the reported state. */
  function fail(message: string): void {
    state = { phase: "failed", output: message, sequence: state.sequence };
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
    configureServer(server: ViteDevServer): void {
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
          if (line.startsWith("[ttsc] rebuilding"))
            state = {
              phase: "checking",
              output: "",
              sequence: state.sequence + 1,
            };
          else if (line === "[ttsc] watch build complete") {
            ++completed;
            state.phase = "passed";
          } else if (line === "[ttsc] watch build failed") {
            ++completed;
            state.phase = "failed";
          } else if (line.startsWith("[ttsc] watch error")) fail(line);
          else state.output = (state.output + line + "\n").slice(-131072);
          if (line.startsWith("[ttsc]")) publish(server);
        }
      };
      child.stdout?.on("data", observe);
      child.stderr?.on("data", observe);
      child.once("error", (error: Error): void => {
        fail(error.message);
        publish(server);
      });
      child.once("close", (): void => {
        fail("Human compiler owner closed");
        publish(server);
      });
      server.middlewares.use(
        "/__human/compiler",
        (request: IncomingMessage, response: ServerResponse): void => {
          response.setHeader("content-type", "application/json");
          response.setHeader("cache-control", "no-store");
          if (request.url?.startsWith("/close") && request.method === "POST") {
            void close()
              .then((): void => {
                response.end(JSON.stringify({ ...state, closed: true }));
              })
              .catch((error: unknown): void => {
                response.statusCode = 500;
                response.end(JSON.stringify({ error: String(error) }));
              });
          } else if (
            request.url?.startsWith("/restart") &&
            request.method === "POST"
          ) {
            response.end(JSON.stringify({ restarting: true }));
            void server.restart();
          } else if (request.url?.startsWith("/source")) {
            void fingerprint()
              .then((sourceSha256: string): void => {
                response.end(JSON.stringify({ sourceSha256 }));
              })
              .catch((error: unknown): void => {
                response.statusCode = 500;
                response.end(JSON.stringify({ error: String(error) }));
              });
          } else
            response.end(JSON.stringify({ ...state, builds: completed }));
        },
      );
    },
    closeBundle: close,
  };
  return { plugin };
}

/** The advisory checker plugin. */
export namespace createHumanCompilerPlugin {
  /** Vite owns this plugin's checker lifetime. */
  export interface IOwner {
    /** Reports the checker's current cycle; it gates nothing. */
    plugin: Plugin;
  }
}
