import { type ChildProcess, fork } from "node:child_process";
import path from "node:path";
import {
  Worker,
  isMainThread,
  parentPort,
  workerData,
} from "node:worker_threads";

import { HumanImageTemporaryDirectory } from "./HumanImageTemporaryDirectory.ts";
import { readHumanImagePublicationBytes } from "./readHumanImagePublicationBytes.ts";
import { serveHumanImageLifecycle } from "./serveHumanImageLifecycle.ts";

/** One pending reply owns its settlement callbacks and deadline timer. */
interface IReplyObserver {
  resolve: (value: Record<string, unknown>) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

/** Own isolated lifecycle transport for the Human worker child, which starts one headless Chrome tab blank and mounts the command's page lazily.
 * IPC disconnect requests normal browser shutdown; worker exit alone does not establish descendant absence. The worker heap defaults to 768 MiB; AUTOMOVIE_HUMAN_WORKER_HEAP_MIB overrides it with an integer from 256 to 1024.
 *
 * @evidence contracts/common.md#principled-implementation A lifecycle Worker retains the original ChildProcess and private IPC channel; disconnect requests the child's existing normal browser shutdown, while command IDs and publication hashes qualify replies.
 * @evidence contracts/common.md#clear-and-simple-design HTTP transport, lifecycle IPC and the Chrome-owning child have distinct owners; this class joins them without generating or rendering itself.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No PID-only termination, model fallback or synthetic output replaces a failed child command.
 * @evidence contracts/common.md#meaningful-documentation Documents isolated ownership, normal browser-close requests, bounded waits and descendant cleanup uncertainty.
 * @evidence contracts/performance.md#efficient-algorithms Ordinary geometry uses publication files and Mannequin snapshots use JSON-text IPC; publication reads/hash scale with the declared maximum 256 MiB and normal shutdown starts no OS-query process.
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
  private directory: HumanImageTemporaryDirectory | undefined;
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
   * @evidence contracts/common.md#principled-implementation Main-thread calls request lifecycle startup; that thread owns one temporary directory, original fork result and its private IPC channel and awaits readiness.
   * @evidence contracts/common.md#clear-and-simple-design The starting promise keeps concurrent callers on the same acquisition path.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Readiness means the child has a blank Chrome tab, document observer and IPC listener; the command mounts its page later, and startup does not prove generation or render success.
   * @evidence contracts/common.md#meaningful-documentation Documents shared failure and the distinction between readiness and implemented generation.
   * @evidence contracts/performance.md#efficient-algorithms One thread/child startup dominates fixed-size control messages; normal ownership needs no separate OS-query process.
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
   * @evidence contracts/common.md#meaningful-documentation Startup ready means the owned browser/page observer exists on a blank tab, not that a model is generated; commands lazily mount their actual page and ordinary generate/render/diagram and Mannequin replies remain distinct.
   * @evidence contracts/performance.md#efficient-algorithms Ordinary full geometry uses its publication file; Mannequin snapshots cross browser/child/lifecycle boundaries as JSON text and are parsed for actual commitment verification. Structured-clone cost scales with reply bytes and this generic transport imposes no payload byte cap.
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
        try {
          this.child!.send({ ...value, id }, (error: Error | null): void => {
            if (error && !this.closed) this.fail(error);
          });
        } catch (error: unknown) {
          this.fail(error instanceof Error ? error : new Error(String(error)));
        }
      },
    );
  }
  /** Verify bytes under this owner's exact publication path; the caller owns the returned Buffer.
   *
   * @evidence contracts/common.md#principled-implementation Supplies only the original lifecycle-owned path to the existing exact byte/hash verifier.
   * @evidence contracts/common.md#clear-and-simple-design Process retains path ownership while byte admission has one helper.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing ownership, changed bytes and oversize declarations reject without another publication.
   * @evidence contracts/common.md#meaningful-documentation The ordinary Session receives a verified Buffer; Mannequin does not use this path.
   * @evidence contracts/performance.md#efficient-algorithms Delegates one O(B) read and SHA pass, bounded by the existing declared 256 MiB cap.
   * @evidence contracts/performance.md#reuse-equivalent-work Each read verifies current bytes; the Session owns successful reuse.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Keeps no extra Buffer; the lifecycle owner removes its file on successful close.
   */
  public async publication(record: Record<string, unknown>): Promise<Buffer> {
    return readHumanImagePublicationBytes(
      isMainThread
        ? this.remotePath
        : path.join(this.directory!.path, "publication.json"),
      record,
    );
  }
  /** Join one sticky cleanup attempt; rejection preserves uncertain ownership.
   *
   * @evidence contracts/common.md#principled-implementation Close seals admission, settles child observers and disconnects the original IPC channel before joining startup; verified normal exit precedes owned-directory removal.
   * @evidence contracts/common.md#clear-and-simple-design Main-thread retirement asks the lifecycle owner to release its original resources before joining the thread exit.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing normal exit or nonzero shutdown rejects and retains ownership; no timeout authorizes a PID kill or fabricated release.
   * @evidence contracts/common.md#meaningful-documentation Documents joined cleanup, sticky failure and retained uncertain ownership.
   * @evidence contracts/performance.md#efficient-algorithms Normal IPC disconnect and exit require no CIM snapshot or cleanup PowerShell; directory removal scales with its contents.
   * @evidence contracts/performance.md#reuse-equivalent-work Repeated close calls share closing, including its rejection, without another cleanup or replacement process.
   * @evidence contracts/performance.md#bound-retention-and-release-resources A five-second normal-exit deadline reports failure without termination; successful exit/removal drops child, directory and thread/path references, while failure retains them.
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
      const heapMiB: number = Number(
        process.env.AUTOMOVIE_HUMAN_WORKER_HEAP_MIB ?? "768",
      );
      if (!Number.isSafeInteger(heapMiB) || heapMiB < 256 || heapMiB > 1024)
        throw new Error(
          "Human worker heap override must be an integer from 256 to 1024 MiB",
        );
      const directory: HumanImageTemporaryDirectory =
        await HumanImageTemporaryDirectory.create();
      this.directory = directory;
      if (this.closed) {
        await directory.remove();
        this.directory = undefined;
        throw new Error("Human worker closed during directory acquisition");
      }
      const child: ChildProcess = fork(
        path.join(
          root,
          "packages/playground/src/human-images/humanImageProcessEntry.ts",
        ),
        [],
        {
          cwd: path.join(root, "packages/playground"),
          execArgv: [
            "--experimental-strip-types",
            `--max-old-space-size=${heapMiB}`,
          ],
          serialization: "advanced",
          stdio: ["ignore", "ignore", "pipe", "ipc"],
          env: {
            ...process.env,
            AUTOMOVIE_HUMAN_WORKER_ROOT: root,
            AUTOMOVIE_HUMAN_WORKER_DIRECTORY: directory.path,
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
        if (this.closed) return;
        if (!message || typeof message !== "object") {
          this.fail(new Error("Malformed Human worker message"));
          return;
        }
        const record: Record<string, unknown> = message as Record<
          string,
          unknown
        >;
        if (record.kind === "memory") {
          try {
            const line: string = JSON.stringify({
              event: "human-worker-memory",
              ...record,
            });
            if (Buffer.byteLength(line) <= 4096) console.error(line);
          } catch {
            /* Malformed diagnostic data does not settle a model command. */
          }
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
      await ready;
    } catch (error) {
      void this.close().catch(console.error);
      throw error;
    }
  }
  private async release(): Promise<void> {
    if (this.child?.connected) this.child.disconnect();
    await this.starting?.catch((): undefined => undefined);
    if (this.child !== undefined) {
      if (this.child.connected) this.child.disconnect();
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        await Promise.race([
          this.exited,
          new Promise<never>(
            (
              _resolve: (value: never) => void,
              reject: (error: Error) => void,
            ): void => {
              timer = setTimeout(
                (): void =>
                  reject(
                    new Error(
                      "Human worker normal exit deadline exceeded; ownership retained",
                    ),
                  ),
                5000,
              );
            },
          ),
        ]);
      } finally {
        if (timer !== undefined) clearTimeout(timer);
      }
      if (this.child.exitCode !== 0)
        throw new Error(
          "Human worker did not confirm normal shutdown; ownership retained",
        );
      this.child = undefined;
    }
    if (this.directory !== undefined) {
      await this.directory.remove();
      this.directory = undefined;
    }
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
          resourceLimits: { maxOldGenerationSizeMb: 128 },
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
      serveHumanImageLifecycle(owner, (): string =>
        path.join(owner.directory!.path, "publication.json"),
      );
    }
  }
}
