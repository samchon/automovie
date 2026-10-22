import { createHash } from "node:crypto";
import type { ViteDevServer } from "vite";

import { HumanImageProcess } from "./HumanImageProcess";
import { HumanImageSourceIdentity } from "./HumanImageSourceIdentity";

/** Serialize an isolated generation/native owner while HTTP serves archives.
 * HTTP retains one byte publication and bounded PNGs, never parsed geometry.
 * Exact source/input commitments and asynchronous output hashing guard IPC.
 * One resident worker child keeps Chrome on /human.html across model keys and is replaced only when it stops being active; the current model and its frames are cached until the key changes.
 *
 * @evidence contracts/common.md#principled-implementation A serialized queue binds source bytes and supplied input SHA to one child lease, verifies publication/frame commitments and rechecks source before delivery.
 * @evidence contracts/common.md#clear-and-simple-design The session owns model/frame reuse; process lifecycle and HTTP historical delivery stay with their separate owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A child failure propagates without recovered mesh, old model or successful empty output; input SHA and runtime parameter validation remain caller responsibilities.
 * @evidence contracts/common.md#meaningful-documentation States isolated ownership, publication reuse and resident-worker replacement.
 * @evidence contracts/performance.md#efficient-algorithms Each admitted operation hashes the conservative package-source inventory; a new model key regenerates in the resident child, and frame hits avoid generation/render commands.
 * @evidence contracts/performance.md#reuse-equivalent-work One model key combines observed source hash and supplied input hash; frames additionally match name and optional fresh nonce, with active-child checks before reuse.
 * @evidence contracts/performance.md#bound-retention-and-release-resources At most sixteen requests queue behind one child, which owns one Chrome; one publication and PNG buffers each have a 256 MiB admission cap, frame names have no separate count cap, and close joins the queue and child before dropping caches.
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
  private hostIdentity: string | undefined;
  private closed: boolean = false;
  private admittedRequests: number = 0;
  public constructor(
    _server: ViteDevServer,
    private readonly root: string,
  ) {}

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

        // One frame slot per file name and canonical curve selection.
        const slot: string = name + "|" + curves;

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
        if (this.worker !== undefined && !this.worker.isActive()) {
          // A dead or failed child (for example a Chrome crash) is retired and
          // its model forgotten; the next step starts a fresh one.
          await this.worker.close();
          this.worker = undefined;
          this.cached = undefined;
        }
        if (this.worker === undefined) {
          if (this.closed)
            throw new Error(
              "Human image server closed during worker retirement",
            );

          // One resident child keeps Chrome open across model keys, so only
          // the first request pays the browser and page start.
          const next: HumanImageProcess = new HumanImageProcess();
          this.worker = next;
          await next.start(this.root);
        }
        if (this.cached?.key !== key) {
          this.cached = undefined;
          cacheHit = false;
          const next: HumanImageProcess = this.worker;
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
  }
}
