import { createHash } from "node:crypto";
import type { ViteDevServer } from "vite";

import { HumanImageMannequinFrames } from "./HumanImageMannequinFrames";
import { HumanImageProcess } from "./HumanImageProcess";
import { HumanImageSourceIdentity } from "./HumanImageSourceIdentity";

/** Serialize an isolated generation/capture owner while HTTP serves archives.
 * Ordinary Human retains its byte publication and PNGs. Mannequin retains
 * verified parsed snapshots with shared invariant geometry arrays and six FIFO frames.
 * Exact source/input commitments and asynchronous output hashing guard IPC.
 * One resident worker lazily mounts the Human or Mannequin page; successful retirement must precede replacement, and source/input or mode changes invalidate the corresponding caches.
 *
 * @evidence contracts/common.md#principled-implementation A serialized queue binds source bytes and supplied input SHA to one child lease, verifies publication/frame commitments and rechecks source before delivery.
 * @evidence contracts/common.md#clear-and-simple-design The session owns model/frame reuse; process lifecycle and HTTP historical delivery stay with their separate owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A child failure propagates without recovered mesh, old model or successful empty output; input SHA and runtime parameter validation remain caller responsibilities.
 * @evidence contracts/common.md#meaningful-documentation States isolated ownership, publication reuse and resident-worker replacement.
 * @evidence contracts/performance.md#efficient-algorithms Each admitted operation hashes the conservative package-source inventory; a new model key regenerates in the resident child, and frame hits avoid generation/render commands.
 * @evidence contracts/performance.md#reuse-equivalent-work One model key combines observed source hash and supplied input hash; frames additionally match name and optional fresh nonce, with active-child checks before reuse.
 * @evidence contracts/performance.md#bound-retention-and-release-resources At most sixteen requests queue behind one child/Chrome. Ordinary publication and PNG buffers each have a 256 MiB admission cap and ordinary frame names have no count cap; Mannequin has six FIFO slots sharing invariant geometry arrays with a 256 MiB PNG cap. Close joins child/queue and drops references; the execution owner independently observes original Job members after cleanup.
 */
export class HumanImageSession {
  private queue: Promise<void> = Promise.resolve();
  private worker: HumanImageProcess | undefined;
  private cached:
    | {
        key: string;
        publication: Buffer;
        receipt: object;
        frames: Map<
          string,
          {
            png: Buffer;
            nonce: string | null;
            capturedUtc: string;
            pngSha256: string;
            metadata: unknown;
          }
        >;
      }
    | undefined;
  private mannequinFrames: HumanImageMannequinFrames | undefined;
  private mode: "human" | "mannequin" | undefined;
  private hostIdentity: string | undefined;
  private readonly diagrams: Map<
    string,
    { bytes: Buffer; nonce: string | null; capturedUtc: string; sha256: string }
  > = new Map();
  private closed: boolean = false;
  private admittedRequests: number = 0;
  public constructor(
    _server: ViteDevServer,
    private readonly root: string,
  ) {}

  /** Current admitted work, observed without acquiring a worker or rendering. */
  public pending(): number {
    return this.admittedRequests;
  }

  /** Queue the existing Mannequin page on this session's sole resident worker.
   *
   * @evidence contracts/common.md#principled-implementation Existing admission and queue serialize actual page-mode changes; the frame owner verifies source, input, buffers, GPU and pixels.
   * @evidence contracts/common.md#clear-and-simple-design Page-specific metadata/cache remain in HumanImageMannequinFrames while this owner retains native lifecycle.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Switching representation invalidates ordinary caches; no ordinary publication or historical pixels substitute for a Mannequin frame.
   * @evidence contracts/common.md#meaningful-documentation Supports static diagnostic frames independently of motion or anatomical approval.
   * @evidence contracts/performance.md#efficient-algorithms Exact-fresh frames reuse verified snapshots and pixels on one page.
   * @evidence contracts/performance.md#reuse-equivalent-work Source/input/frame/nonce identity qualify reuse; switching modes clears incompatible caches.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Shares sixteen admission slots and one child; close or representation replacement drops the six-frame cache.
   */
  public async mannequin(
    input: { value: Record<string, unknown>; sha256: string },
    name: string,
    nonce?: string,
  ): Promise<Awaited<ReturnType<HumanImageMannequinFrames["frame"]>>> {
    if (nonce !== undefined && !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(nonce))
      throw new Error("Fresh nonce requires one to sixty-four safe characters");
    if (this.closed || this.admittedRequests >= 16)
      throw new Error("Human image queue is closed or full");
    this.admittedRequests++;
    const work: Promise<
      Awaited<ReturnType<HumanImageMannequinFrames["frame"]>>
    > = this.queue.then(
      async (): Promise<
        Awaited<ReturnType<HumanImageMannequinFrames["frame"]>>
      > => {
        if (this.closed) throw new Error("Human image server is closing");
        this.cached = undefined;
        this.diagrams.clear();
        this.mode = "mannequin";
        const worker: HumanImageProcess = await this.resident();
        this.mannequinFrames ??= new HumanImageMannequinFrames(this.root);
        return this.mannequinFrames.frame(worker, input, name, nonce);
      },
    );
    this.queue = work.then((): void => {}).catch((): void => {});
    try {
      return await work;
    } finally {
      this.admittedRequests--;
    }
  }
  /** Queue one model/frame request; reject invalid nonces, full queues or closed sessions.
   * The resident child generates and renders in its Chrome page. `curves` is the canonical selection from `normalizeHumanCurves`; it joins the frame identity and the receipt. Input value/SHA consistency is supplied by the caller.
   *
   * @evidence contracts/common.md#principled-implementation The serialized operation observes source/host hashes, derives a model key, verifies worker commitments and refuses source changes before returning publication or frame bytes.
   * @evidence contracts/common.md#clear-and-simple-design One queue protects a model lease and its frame Map while independent archive HTTP reads need no session operation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A worker error rejects without fallback; on-disk source hashes neither validate arbitrary Human inputs nor certify the currently loaded module graph.
   * @evidence contracts/common.md#meaningful-documentation Documents nonce/queue failure, caller SHA responsibility and in-page generation.
   * @evidence contracts/performance.md#efficient-algorithms Source hashing scans bytes of five packages per identity check; cache hits save child generation/rendering, while PNG byte accounting scans the retained frame Map.
   * @evidence contracts/performance.md#reuse-equivalent-work Source/input key and active child permit model reuse; name and curve selection plus absent or matching nonce permit frame reuse, preserving original capture UTC and PNG SHA.
   * @evidence contracts/performance.md#bound-retention-and-release-resources finally releases each of at most sixteen admission slots; an inactive child is closed before its replacement starts, PNG admission caps retained pixels at 256 MiB, and failures may leave that one child owned until replacement or close.
   */
  public async image(
    input: { value: Record<string, unknown>; sha256: string },
    name: string,
    nonce?: string,
    curves: string = "",
    view: string = "",
  ): Promise<{
    png: Buffer;
    key: string;
    cacheHit: boolean;
    receipt: object;
    capturedUtc: string | undefined;
    pngSha256: string | undefined;
  }> {
    if (nonce !== undefined && !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(nonce))
      throw new Error("Fresh nonce requires one to sixty-four safe characters");
    if (this.closed || this.admittedRequests >= 16)
      throw new Error("Human image queue is closed or full");
    this.admittedRequests++;
    const work: Promise<{
      png: Buffer;
      key: string;
      cacheHit: boolean;
      receipt: object;
      capturedUtc: string | undefined;
      pngSha256: string | undefined;
    }> = this.queue.then(
      async (): Promise<{
        png: Buffer;
        key: string;
        cacheHit: boolean;
        receipt: object;
        capturedUtc: string | undefined;
        pngSha256: string | undefined;
      }> => {
        if (this.closed) throw new Error("Human image server is closing");

        this.mannequinFrames?.clear();
        this.mode = "human";
        // One frame slot per file name, canonical curve selection and free view.
        const slot: string = name + "|" + curves + "|" + view;

        const host: string = await HumanImageSourceIdentity.host(this.root);
        if (this.hostIdentity !== undefined && host !== this.hostIdentity)
          throw new Error("Human host changed; restart this server");
        this.hostIdentity = host;
        const source: string = await HumanImageSourceIdentity.source(this.root);
        const key: string = createHash("sha256")
          .update(source + input.sha256)
          .digest("hex");
        const previous: { nonce: string | null } | undefined =
          this.cached?.key === key ? this.cached.frames.get(slot) : undefined;
        let cacheHit: boolean =
          this.cached?.key === key &&
          (name === "$model" ||
            (previous !== undefined &&
              (nonce === undefined || previous.nonce === nonce)));
        const resident: HumanImageProcess = await this.resident();
        if (this.cached?.key !== key) {
          this.cached = undefined;
          cacheHit = false;
          const next: HumanImageProcess = resident;
          const result: Record<string, unknown> = await next.request({
            kind: "generate",
            source,
            key,
            inputSha256: input.sha256,
            value: input.value,
          });
          if (
            result.key !== key ||
            result.source !== source ||
            result.inputSha256 !== input.sha256 ||
            result.receipt === null ||
            typeof result.receipt !== "object"
          )
            throw new Error("Worker generation identity mismatch");
          const publication: Buffer = await next.publication(result);
          if (
            this.closed ||
            (await HumanImageSourceIdentity.source(this.root)) !== source
          )
            throw new Error("Human source changed during isolated generation");
          this.cached = {
            key,
            publication,
            receipt: result.receipt,
            frames: new Map(),
          };
        }
        const worker: HumanImageProcess | undefined = this.worker;
        if (worker === undefined)
          throw new Error("Human model has no process owner");
        if (name !== "$model" && !cacheHit) {
          const result: Record<string, unknown> = await worker.request({
            kind: "render",
            source,
            key,
            name,
            curves,
            view,
          });
          if (
            result.key !== key ||
            result.source !== source ||
            !Buffer.isBuffer(result.png) ||
            typeof result.capturedUtc !== "string" ||
            !Number.isFinite(Date.parse(result.capturedUtc)) ||
            typeof result.pngSha256 !== "string" ||
            createHash("sha256").update(result.png).digest("hex") !==
              result.pngSha256
          )
            throw new Error("Worker frame identity mismatch");
          const retained: number =
            [...this.cached.frames.values()].reduce(
              (sum: number, value: { png: Buffer }): number =>
                sum + value.png.length,
              0,
            ) -
            (this.cached.frames.get(slot)?.png.length ?? 0) +
            result.png.length;
          if (retained > 268435456)
            throw new Error("Human PNG cache exceeds its byte budget");
          this.cached.frames.set(slot, {
            png: result.png,
            nonce: nonce ?? null,
            capturedUtc: result.capturedUtc,
            pngSha256: result.pngSha256,
            metadata: result.metadata,
          });
        }
        if (
          this.closed ||
          (await HumanImageSourceIdentity.source(this.root)) !== source
        ) {
          this.cached = undefined;
          throw new Error("Human source changed during this request");
        }
        if ((await HumanImageSourceIdentity.host(this.root)) !== host) {
          this.cached = undefined;
          throw new Error(
            "Human host changed during this request; restart this server",
          );
        }
        const capture:
          | {
              png: Buffer;
              nonce: string | null;
              capturedUtc: string;
              pngSha256: string;
              metadata: unknown;
            }
          | undefined = this.cached.frames.get(slot);
        if (name !== "$model" && !capture)
          throw new Error("Worker frame is missing");
        return {
          png: name === "$model" ? this.cached.publication : capture!.png,
          key,
          cacheHit,
          capturedUtc: capture?.capturedUtc,
          pngSha256: capture?.pngSha256,
          receipt: {
            ...this.cached.receipt,
            frame: name,
            curves,
            view,
            capture:
              capture === undefined
                ? undefined
                : {
                    nonce: capture.nonce,
                    capturedUtc: capture.capturedUtc,
                    pngSha256: capture.pngSha256,
                    metadata: capture.metadata,
                  },
            cacheHit,
          },
        };
      },
    );
    this.queue = work.then((): void => {}).catch((): void => {});
    try {
      return await work;
    } finally {
      this.admittedRequests--;
    }
  }

  /** Queue one 2D curve diagram; same queue, nonce and source rules as frames.
   * Diagrams need no generated model, so they never disturb the model cache;
   * up to 32 recent diagrams are kept by source, alias, curve list and format.
   *
   * @evidence contracts/common.md#principled-implementation The key commits to the observed source hash, alias, canonical curves and format; a present nonce that differs from the stored one forces a new draw, and the source is rechecked before delivery.
   * @evidence contracts/common.md#clear-and-simple-design Shares the queue and resident worker with frames; drawing stays in the page.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Worker errors and SHA mismatches reject; no older diagram is returned for a changed source.
   * @evidence contracts/common.md#meaningful-documentation States cache identity, nonce rule and bound.
   * @evidence contracts/performance.md#efficient-algorithms One source hash per check and one worker draw on a miss.
   * @evidence contracts/performance.md#reuse-equivalent-work Hits return the stored bytes with their original capture UTC and SHA.
   * @evidence contracts/performance.md#bound-retention-and-release-resources FIFO retention of 32 diagrams; close drops them with the session.
   */
  public async diagram(
    alias: string,
    curves: string,
    format: "png" | "svg",
    nonce?: string,
  ): Promise<{
    bytes: Buffer;
    key: string;
    cacheHit: boolean;
    capturedUtc: string;
    sha256: string;
    receipt: object;
  }> {
    if (nonce !== undefined && !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(nonce))
      throw new Error("Fresh nonce requires one to sixty-four safe characters");
    if (this.closed || this.admittedRequests >= 16)
      throw new Error("Human image queue is closed or full");
    this.admittedRequests++;
    const work: Promise<Awaited<ReturnType<HumanImageSession["diagram"]>>> =
      this.queue.then(
        async (): Promise<
          Awaited<ReturnType<HumanImageSession["diagram"]>>
        > => {
          if (this.closed) throw new Error("Human image server is closing");
          if (this.mode === "mannequin") {
            this.cached = undefined;
            this.diagrams.clear();
            this.mannequinFrames?.clear();
          }
          this.mode = "human";
          const source: string = await HumanImageSourceIdentity.source(
            this.root,
          );
          const key: string = createHash("sha256")
            .update(JSON.stringify([source, alias, curves, format]))
            .digest("hex");
          const stored:
            | {
                bytes: Buffer;
                nonce: string | null;
                capturedUtc: string;
                sha256: string;
              }
            | undefined = this.diagrams.get(key);
          let cacheHit: boolean =
            stored !== undefined &&
            (nonce === undefined || stored.nonce === nonce);
          if (!cacheHit) {
            const worker: HumanImageProcess = await this.resident();
            const result: Record<string, unknown> = await worker.request({
              kind: "diagram",
              source,
              key,
              alias,
              curves,
              format,
            });

            // Structured clone across the lifecycle thread delivers a Uint8Array.
            const bytes: Buffer = Buffer.from(
              result.bytes instanceof Uint8Array
                ? result.bytes
                : new Uint8Array(),
            );
            if (
              result.key !== key ||
              !(result.bytes instanceof Uint8Array) ||
              createHash("sha256").update(bytes).digest("hex") !==
                result.sha256 ||
              typeof result.capturedUtc !== "string"
            )
              throw new Error("Worker diagram identity mismatch");
            this.diagrams.delete(key);
            this.diagrams.set(key, {
              bytes,
              nonce: nonce ?? null,
              capturedUtc: result.capturedUtc,
              sha256: result.sha256,
            });
            while (this.diagrams.size > 32)
              this.diagrams.delete(this.diagrams.keys().next().value!);
            cacheHit = false;
          }
          if ((await HumanImageSourceIdentity.source(this.root)) !== source) {
            this.diagrams.delete(key);
            throw new Error("Human source changed during this request");
          }
          const entry: {
            bytes: Buffer;
            nonce: string | null;
            capturedUtc: string;
            sha256: string;
          } = this.diagrams.get(key)!;
          return {
            bytes: entry.bytes,
            key,
            cacheHit,
            capturedUtc: entry.capturedUtc,
            sha256: entry.sha256,
            receipt: {
              kind: "human-curve-diagram",
              key,
              sourceSha256: source,
              alias,
              curves,
              format,
              nonce: entry.nonce,
              capturedUtc: entry.capturedUtc,
              sha256: entry.sha256,
              cacheHit,
            },
          };
        },
      );
    this.queue = work.then((): void => {}).catch((): void => {});
    try {
      return await work;
    } finally {
      this.admittedRequests--;
    }
  }

  /** The active resident worker, replacing an inactive one (which forgets the model cache). */
  private async resident(): Promise<HumanImageProcess> {
    if (this.worker !== undefined && !this.worker.isActive()) {
      // A dead or failed child (for example a Chrome crash) is retired and
      // its model forgotten; the next step starts a fresh one.
      await this.worker.close();
      this.worker = undefined;
      this.cached = undefined;
      this.mannequinFrames?.clear();
    }
    if (this.worker === undefined) {
      if (this.closed)
        throw new Error("Human image server closed during worker retirement");

      // One resident child keeps Chrome open across model keys, so only the
      // first request pays the browser and page start.
      const next: HumanImageProcess = new HumanImageProcess();
      this.worker = next;
      await next.start(this.root);
    }
    return this.worker;
  }

  /** Seal admission, retire the child and join queued operations before dropping caches.
   *
   * @evidence contracts/common.md#principled-implementation Closed state rejects queued work; process close runs before and after the settled queue to cover an in-flight acquisition.
   * @evidence contracts/common.md#clear-and-simple-design Session retirement owns only its child lease and publication/frame references, not the HTTP server or archive.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Child cleanup rejection propagates and does not certify released native resources.
   * @evidence contracts/common.md#meaningful-documentation Documents admission sealing, queue joining and cache release order.
   * @evidence contracts/performance.md#efficient-algorithms Retirement waits for the admitted queue and one child cleanup without rebuilding geometry or scanning source files.
   * @evidence contracts/performance.md#reuse-equivalent-work Repeated calls reuse the process owner's sticky close and the same settled queue; no replacement child is acquired.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Success drops the child and all cached publication/PNG references; failure retains the child reference and may retain caches for unresolved cleanup.
   */
  public async close(): Promise<void> {
    this.closed = true;
    await this.worker?.close();
    await this.queue;
    await this.worker?.close();
    this.worker = undefined;
    this.cached = undefined;
    this.diagrams.clear();
    this.mannequinFrames?.clear();
  }
}
