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

/** One pending reply owns its settlement callbacks and deadline timer. */
interface IReplyObserver {
  resolve: (value: Record<string, unknown>) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

/** Own isolated lifecycle transport for the Human worker child, which keeps one headless Chrome tab on `/human.html`.
 * Chrome runs on a Playwright pipe and exits when a stopped child closes it.
 *
 * @evidence contracts/common.md#principled-implementation A lifecycle Worker retains the original ChildProcess and delegates checked native ownership to ProcessOwnership; command IDs and publication hashes qualify replies.
 * @evidence contracts/common.md#clear-and-simple-design HTTP transport, blocking OS lifecycle work and the Chrome-owning child have distinct owners; this class joins them without generating or rendering itself.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No PID-only termination, model fallback or synthetic output replaces a failed child command.
 * @evidence contracts/common.md#meaningful-documentation Documents isolated ownership, Chrome exit with its child, bounded waits and cleanup uncertainty.
 * @evidence contracts/performance.md#efficient-algorithms Lifecycle messages avoid geometry-object IPC; publication reads/hash scale with the declared maximum 256 MiB and native process checks run in the lifecycle thread.
 * @evidence contracts/performance.md#reuse-equivalent-work One owner shares startup and sticky close promises; child failures cannot silently acquire another child.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Each instance owns at most one lifecycle thread, child and temporary directory; remote observers are capped at two, child commands at one, and cleanup failure retains ownership rather than claiming release.
 */
export class HumanImageProcess {
  private remote: Worker | undefined;
  private remoteExit: Promise<undefined> | undefined;
  private remoteActive: boolean = false;
  private remotePath: string | undefined;
  private readonly remotePending: Map<number, IReplyObserver> = new Map();
  private child: ChildProcess | undefined;
  private directory: string | undefined;
  private closed: boolean = false;
  private sequence: number = 0;
  private starting: Promise<void> | undefined;
  private closing: Promise<void> | undefined;
  private pending: (IReplyObserver & { id: number }) | undefined;
  private ready:
    | {
        resolve: () => void;
        reject: (error: Error) => void;
        timer: ReturnType<typeof setTimeout>;
      }
    | undefined;
  private exited: Promise<undefined> | undefined;
  private tail: string = "";
  /** Share one startup attempt, including a failed attempt, until the owner closes.
   *
   * @evidence contracts/common.md#principled-implementation Main-thread calls request lifecycle startup; that thread creates one temporary directory and original child, captures ownership and awaits IPC readiness.
   * @evidence contracts/common.md#clear-and-simple-design The starting promise keeps concurrent callers on the same acquisition path.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Readiness means the child has Chrome on /human.html and its IPC listener; it does not prove that a later generation or render succeeds.
   * @evidence contracts/common.md#meaningful-documentation Documents shared failure and the distinction between readiness and implemented generation.
   * @evidence contracts/performance.md#efficient-algorithms One thread/child startup and native ownership query dominate fixed-size control messages.
   * @evidence contracts/performance.md#reuse-equivalent-work starting retains the first startup promise, so repeated calls do not spawn replacement workers.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Child readiness has a 300-second deadline and remote commands 330 seconds; failures request cleanup, while uncertain native cleanup retains original handles and directory ownership.
   */
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
  /** Report the cached lifecycle connection state, not generation capability.
   *
   * @evidence contracts/common.md#principled-implementation Closed state gates the main-thread remote status or the child connection/readiness fields.
   * @evidence contracts/common.md#clear-and-simple-design Session lease checks borrow this owner's lifecycle observation rather than inspecting a PID.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts An active connection does not prove model admission or a successful page command.
   * @evidence contracts/common.md#meaningful-documentation Distinguishes observed transport liveness from supported generation.
   * @evidence contracts/performance.md#efficient-algorithms Fixed field reads perform no OS discovery or allocation.
   * @evidence contracts/performance.md#reuse-equivalent-work The main thread reuses lifecycle messages; this is not an independent current OS liveness probe.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Reading status retains no task or handle; the instance continues to own its existing worker and child.
   */
  public isActive(): boolean {
    return (
      !this.closed &&
      (isMainThread
        ? this.remoteActive
        : this.child?.connected === true && this.ready === undefined)
    );
  }
  /** Send a command over the owned transport; the child generates or renders in its Chrome page.
   *
   * @evidence contracts/common.md#principled-implementation Sequence IDs match replies to one child command, with transport/closed checks before send; source/input admission belongs to the session, not this generic record transport.
   * @evidence contracts/common.md#clear-and-simple-design Main-thread requests cross the lifecycle worker while the original child and its IPC listeners stay owned there.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Worker errors reject rather than fabricate model or PNG output; arbitrary command records are not asserted to be validated Human parameters.
   * @evidence contracts/common.md#meaningful-documentation States transport ownership and the generate/render commands the child serves.
   * @evidence contracts/performance.md#efficient-algorithms Structured-clone cost scales with command/reply bytes; intended geometry transport uses a file, although this generic method imposes no payload byte cap.
   * @evidence contracts/performance.md#reuse-equivalent-work Effectful commands are not deduplicated; each sequence owns its own reply and deadline.
   * @evidence contracts/performance.md#bound-retention-and-release-resources At most one child command and two remote observers are pending; reply/failure clears timers, command timeout requests close, and remote timeout reports uncertainty without abandoning native ownership.
   */
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
  /** Read the owned publication path and verify its declared bytes and SHA-256.
   *
   * @evidence contracts/common.md#principled-implementation The record must name this instance's publication file with a positive declared size at most 256 MiB; actual bytes and asynchronous SHA must match.
   * @evidence contracts/common.md#clear-and-simple-design File publication avoids transferring a parsed geometry graph over IPC.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A path, size or SHA mismatch rejects; no earlier publication substitutes for a failed one.
   * @evidence contracts/common.md#meaningful-documentation Documents owned-path admission and exact byte/hash verification.
   * @evidence contracts/performance.md#efficient-algorithms One asynchronous file read and SHA pass cost O(B) bytes; the declared cap is checked before read, but an unexpectedly larger on-disk file is allocated before length rejection.
   * @evidence contracts/performance.md#reuse-equivalent-work Each read verifies current bytes; the session owns reuse of a successfully verified publication.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Async read owns no persistent file handle; the returned Buffer belongs to the caller and the instance owns file removal during close.
   */
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
  /** Join one sticky cleanup attempt; rejection preserves uncertain ownership.
   *
   * @evidence contracts/common.md#principled-implementation Close seals admission, settles child observers, joins startup, stops the captured child, awaits exit and removes only its verified temporary directory.
   * @evidence contracts/common.md#clear-and-simple-design Main-thread retirement asks the lifecycle owner to release its original resources before joining the thread exit.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Native stop refusal or timeout does not authorize a PID-only retry or claim released resources.
   * @evidence contracts/common.md#meaningful-documentation Documents joined cleanup, sticky failure and retained uncertain ownership.
   * @evidence contracts/performance.md#efficient-algorithms One native stop/exit and owned-directory removal dominate; file cleanup scales with that directory's contents.
   * @evidence contracts/performance.md#reuse-equivalent-work Repeated close calls share closing, including its rejection, without another cleanup or replacement process.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Successful cleanup removes child, directory and main-thread worker/path references; native refusal or missing exit can retain them, and child exit joining has no separate deadline.
   */
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
