import { type ChildProcess, fork } from "node:child_process";
import { webcrypto } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  Worker,
  isMainThread,
  parentPort,
  workerData,
} from "node:worker_threads";

import { ProcessOwnership } from "../../../viewer/src/process/ProcessOwnership.ts";

/** Own one isolated generator/native child and one private publication file.
 * Large geometry never crosses IPC as an object. Publication IO and SHA are
 * asynchronous on the HTTP owner. Startup and command waits have finite limits;
 * a sticky close joins startup/exit and retains ownership on cleanup failure.
 * The lifecycle thread owns the original ChildProcess and unchanged synchronous
 * OS birth/termination checks. HTTP awaits messages, never those native calls.
 */
export class HumanImageProcess {
  private remote: Worker | undefined;
  private remoteExit: Promise<undefined> | undefined;
  private remoteActive: boolean = false;
  private remotePath: string | undefined;
  private readonly remotePending: Map<
    number,
    {
      resolve: (value: Record<string, unknown>) => void;
      reject: (error: Error) => void;
      timer: ReturnType<typeof setTimeout>;
    }
  > = new Map();
  private child: ChildProcess | undefined;
  private directory: string | undefined;
  private closed: boolean = false;
  private sequence: number = 0;
  private starting: Promise<void> | undefined;
  private closing: Promise<void> | undefined;
  private pending:
    | {
        id: number;
        resolve: (value: Record<string, unknown>) => void;
        reject: (error: Error) => void;
        timer: ReturnType<typeof setTimeout>;
      }
    | undefined;
  private ready:
    | {
        resolve: () => void;
        reject: (error: Error) => void;
        timer: ReturnType<typeof setTimeout>;
      }
    | undefined;
  private exited: Promise<undefined> | undefined;
  private tail: string = "";

  /** Share one finite startup attempt; a failed owner cannot silently respawn. */
  public start(root: string): Promise<void> {
    if (this.closed)
      return Promise.reject(new Error("Human process owner is closed"));
    if (isMainThread) {
      this.starting ??= this.invoke("start", { root }, root).then(
        (result: Record<string, unknown>): void => {
          if (typeof result.path !== "string")
            throw new Error("Lifecycle publication ownership is missing");
          this.remotePath = result.path;
        },
      );
      return this.starting;
    }
    this.starting ??= this.launch(root);
    return this.starting;
  }

  /** Only a connected, admitted model lease can serve another view. */
  public isActive(): boolean {
    return (
      !this.closed &&
      (isMainThread
        ? this.remoteActive
        : this.child?.connected === true && this.ready === undefined)
    );
  }

  /** Send one source/input-bound command without transferring geometry objects. */
  public async request(
    value: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    if (isMainThread) {
      if (this.closed || !this.remoteActive)
        throw new Error("Human lifecycle owner is not active");
      return this.invoke("request", value);
    }
    if (this.closed || !this.child?.connected || this.pending !== undefined)
      throw new Error("Human worker is closed, disconnected or busy");
    const id: number = ++this.sequence;
    return new Promise<Record<string, unknown>>(
      (
        resolve: (value: Record<string, unknown>) => void,
        reject: (error: Error) => void,
      ): void => {
        const timer: ReturnType<typeof setTimeout> = setTimeout((): void => {
          this.fail(new Error("Human worker command deadline exceeded"));
          void this.close().catch(console.error);
        }, 300000);
        this.pending = { id, resolve, reject, timer };
        this.child!.send({ ...value, id }, (error: Error | null): void => {
          if (error) this.fail(error);
        });
      },
    );
  }

  /** Read only the owned publication and hash its bytes off the HTTP event loop. */
  public async publication(record: Record<string, unknown>): Promise<Buffer> {
    const filename: string = isMainThread
      ? this.remotePath!
      : path.join(this.directory!, "publication.json");
    if (filename === undefined)
      throw new Error("Human publication has no lifecycle owner");
    if (
      record.path !== filename ||
      !Number.isSafeInteger(record.bytes) ||
      Number(record.bytes) < 1 ||
      Number(record.bytes) > 268435456
    )
      throw new Error("Invalid worker publication identity");
    const bytes: Buffer<ArrayBuffer> = await fs.readFile(filename);
    const sha: string = Buffer.from(
      await webcrypto.subtle.digest("SHA-256", bytes),
    ).toString("hex");
    if (bytes.length !== record.bytes || sha !== record.sha256)
      throw new Error("Worker publication bytes changed");
    return bytes;
  }

  /** One sticky cancellation/completion joins all acquisition and release work. */
  public close(): Promise<void> {
    if (isMainThread) {
      if (this.closing === undefined) {
        this.closed = true;
        this.closing =
          this.remote === undefined
            ? Promise.resolve()
            : this.invoke("close", {}).then(async (): Promise<void> => {
                await this.remoteExit;
                this.remote = undefined;
                this.remotePath = undefined;
                this.remoteActive = false;
              });
      }
      return this.closing;
    }
    if (this.closing === undefined) {
      this.closed = true;
      this.fail(new Error("Human worker owner closed"));
      this.closing = this.release();
    }
    return this.closing;
  }

  /** Attach lifecycle observers before awaiting readiness or native ownership. */
  private async launch(root: string): Promise<void> {
    try {
      const directory: string = await fs.mkdtemp(
        path.join(os.tmpdir(), "automovie-human-worker-"),
      );
      if (this.closed) {
        await this.remove(directory);
        throw new Error("Human worker closed during directory acquisition");
      }
      this.directory = directory;
      const child: ChildProcess = fork(
        path.join(
          root,
          "packages/playground/src/human-images/humanImageProcessEntry.ts",
        ),
        [],
        {
          cwd: path.join(root, "packages/playground"),
          execArgv: ["--experimental-strip-types"],
          serialization: "advanced",
          stdio: ["ignore", "ignore", "pipe", "ipc"],
          env: {
            ...process.env,
            AUTOMOVIE_HUMAN_WORKER_ROOT: root,
            AUTOMOVIE_HUMAN_WORKER_DIRECTORY: directory,
          },
        },
      );
      this.child = child;
      this.exited = new Promise<undefined>(
        (resolve: (value: undefined) => void): void => {
          child.once("exit", (): void => {
            parentPort?.postMessage({ kind: "inactive" });
            this.fail(new Error("Human child exited: " + this.tail));
            resolve(undefined);
          });
          child.once("error", (error: Error): void => {
            this.fail(error);
            if (child.pid === undefined) resolve(undefined);
          });
        },
      );
      const ready: Promise<undefined> = new Promise<undefined>(
        (
          resolve: (value: undefined) => void,
          reject: (error: Error) => void,
        ): void => {
          const timer: ReturnType<typeof setTimeout> = setTimeout((): void => {
            this.fail(new Error("Human worker startup deadline exceeded"));
            void this.close().catch(console.error);
          }, 300000);
          this.ready = {
            resolve: (): void => resolve(undefined),
            reject,
            timer,
          };
        },
      );
      // Ownership acquisition can fail synchronously before the ready await.
      void ready.catch((): undefined => undefined);
      child.stderr?.on("data", (bytes: Buffer): void => {
        this.tail = (this.tail + bytes.toString("utf8")).slice(-65536);
      });
      child.on("message", (message: unknown): void => {
        if (!message || typeof message !== "object") {
          this.fail(new Error("Malformed Human worker message"));
          return;
        }
        const record: Record<string, unknown> = message as Record<
          string,
          unknown
        >;
        if (record.kind === "memory") {
          console.error(
            JSON.stringify({ event: "human-worker-memory", ...record }),
          );
          return;
        }
        if (record.kind === "ready") {
          if (this.ready !== undefined) {
            clearTimeout(this.ready.timer);
            this.ready.resolve();
            this.ready = undefined;
          }
          return;
        }
        const pending: HumanImageProcess["pending"] = this.pending;
        if (pending === undefined || record.id !== pending.id) {
          this.fail(new Error("Human worker response identity mismatch"));
          return;
        }
        clearTimeout(pending.timer);
        this.pending = undefined;
        if (record.error !== undefined)
          pending.reject(new Error(String(record.error)));
        else pending.resolve(record);
      });
      ProcessOwnership.own(child);
      await ready;
    } catch (error) {
      void this.close().catch(console.error);
      throw error;
    }
  }

  /** Join startup before stopping its exact captured process and removing files. */
  private async release(): Promise<void> {
    await this.starting?.catch((): undefined => undefined);
    if (this.child !== undefined) {
      ProcessOwnership.stopChild(this.child);
      await this.exited;
      this.child = undefined;
    }
    if (this.directory !== undefined) {
      await this.remove(this.directory);
      this.directory = undefined;
    }
  }

  /** Resolve the absolute owned target before recursive deletion. */
  private async remove(directory: string): Promise<void> {
    const resolved: string = await fs.realpath(directory),
      base: string = await fs.realpath(os.tmpdir());
    const relative: string = path.relative(base, resolved);
    if (
      path.dirname(relative) !== "." ||
      !path.basename(relative).startsWith("automovie-human-worker-") ||
      (await fs.lstat(directory)).isSymbolicLink()
    )
      throw new Error(
        "Worker cleanup target lost its owned temporary boundary",
      );
    await fs.rm(resolved, { recursive: true });
  }

  /** Settle observers once; errors never discard the original child ownership. */
  private fail(error: Error): void {
    if (this.ready !== undefined) {
      clearTimeout(this.ready.timer);
      this.ready.reject(error);
      this.ready = undefined;
    }
    if (this.pending !== undefined) {
      clearTimeout(this.pending.timer);
      this.pending.reject(error);
      this.pending = undefined;
    }
  }

  /** Send bounded lifecycle commands while the original handle stays off HTTP.
   * A deadline reports uncertainty and retains the worker; it never terminates
   * the thread and abandons an original child or an outstanding OS operation.
   */
  private invoke(
    operation: string,
    value: Record<string, unknown>,
    root?: string,
  ): Promise<Record<string, unknown>> {
    if (this.remote === undefined) {
      if (operation !== "start" || root === undefined)
        return Promise.reject(
          new Error("Human lifecycle thread is unavailable"),
        );
      const thread: Worker = new Worker(
        path.join(
          root,
          "packages/playground/src/human-images/HumanImageProcess.ts",
        ),
        {
          execArgv: ["--experimental-strip-types"],
          workerData: { role: "human-image-lifecycle" },
        },
      );
      this.remote = thread;
      this.remoteExit = new Promise<undefined>(
        (resolve: (value: undefined) => void): void => {
          thread.once("exit", (code: number): void => {
            this.remoteActive = false;
            this.failRemote(
              new Error("Human lifecycle thread exited: " + code),
            );
            resolve(undefined);
          });
        },
      );
      thread.once("error", (error: Error): void => {
        this.remoteActive = false;
        this.failRemote(error);
      });
      thread.on("message", (message: unknown): void => {
        if (!message || typeof message !== "object") {
          this.failRemote(new Error("Malformed Human lifecycle response"));
          return;
        }
        const response: Record<string, unknown> = message as Record<
          string,
          unknown
        >;
        if (response.kind === "inactive") {
          this.remoteActive = false;
          return;
        }
        const pending: ReturnType<typeof this.remotePending.get> =
          this.remotePending.get(Number(response.id));
        if (pending === undefined) {
          this.failRemote(
            new Error("Human lifecycle response identity mismatch"),
          );
          return;
        }
        this.remotePending.delete(Number(response.id));
        clearTimeout(pending.timer);
        this.remoteActive = response.active === true;
        if (response.error !== undefined)
          pending.reject(new Error(String(response.error)));
        else if (response.result && typeof response.result === "object") {
          const result: Record<string, unknown> = response.result as Record<
            string,
            unknown
          >;
          // Worker structured clone preserves bytes but represents Buffer as Uint8Array.
          if (result.png instanceof Uint8Array && !Buffer.isBuffer(result.png))
            result.png = Buffer.from(
              result.png.buffer,
              result.png.byteOffset,
              result.png.byteLength,
            );
          pending.resolve(result);
        } else pending.reject(new Error("Human lifecycle result is missing"));
      });
    }
    if (this.remotePending.size >= 2)
      return Promise.reject(
        new Error("Human lifecycle command budget exceeded"),
      );
    const id: number = ++this.sequence;
    return new Promise<Record<string, unknown>>(
      (
        resolve: (value: Record<string, unknown>) => void,
        reject: (error: Error) => void,
      ): void => {
        const timer: ReturnType<typeof setTimeout> = setTimeout((): void => {
          this.remoteActive = false;
          this.failRemote(
            new Error(
              "Human lifecycle command deadline exceeded; ownership retained",
            ),
          );
        }, 330000);
        this.remotePending.set(id, { resolve, reject, timer });
        try {
          this.remote!.postMessage({ id, operation, value });
        } catch (error) {
          this.failRemote(
            error instanceof Error ? error : new Error(String(error)),
          );
        }
      },
    );
  }

  /** Settle bounded parent observers without discarding uncertain OS ownership. */
  private failRemote(error: Error): void {
    for (const pending of this.remotePending.values()) {
      clearTimeout(pending.timer);
      pending.reject(error);
    }
    this.remotePending.clear();
  }

  static {
    if (
      !isMainThread &&
      (workerData as { role?: unknown } | null)?.role ===
        "human-image-lifecycle"
    ) {
      const owner: HumanImageProcess = new HumanImageProcess();
      parentPort!.on("message", (message: unknown): void => {
        const command: {
          id: number;
          operation: string;
          value: Record<string, unknown>;
        } = message as typeof command;
        const run: () => Promise<void> = async (): Promise<void> => {
          if (!command || !Number.isSafeInteger(command.id))
            throw new Error("Malformed Human lifecycle command");
          let result: Record<string, unknown>;
          if (command.operation === "start") {
            await owner.start(String(command.value.root));
            result = { path: path.join(owner.directory!, "publication.json") };
          } else if (command.operation === "request")
            result = await owner.request(command.value);
          else if (command.operation === "close") {
            await owner.close();
            result = {};
          } else throw new Error("Unknown Human lifecycle operation");
          parentPort!.postMessage({
            id: command.id,
            result,
            active: owner.isActive(),
          });
          if (command.operation === "close") parentPort!.close();
        };
        void run().catch((error: unknown): void => {
          parentPort!.postMessage({
            id: command?.id,
            error: error instanceof Error ? error.message : String(error),
            active: owner.isActive(),
          });
        });
      });
    }
  }
}
