import { createHash } from "node:crypto";

import { HumanImageProcess } from "./HumanImageProcess";
import { HumanImageSourceIdentity } from "./HumanImageSourceIdentity";

/** Caller owns the typed value and its exact JSON commitment. */
type Input = { value: Record<string, unknown>; sha256: string };
/** One publication or frame, returned with actual capture facts and model commitment. */
type Frame = { png: Buffer; key: string; cacheHit: boolean; receipt: object; capturedUtc: string | undefined; pngSha256: string | undefined };
/** One same-model diagram; caller owns its checked bytes. */
type Diagram = { bytes: Buffer; key: string; cacheHit: boolean; capturedUtc: string; sha256: string; receipt: object };
/** Serialize an isolated generation/native owner while HTTP serves archives.
 * HTTP retains one byte publication and bounded PNGs, never parsed geometry.
 * Exact source/input commitments and asynchronous output hashing guard IPC.
 * One resident worker child keeps Chrome on /human.html across model keys and is replaced only when it stops being active; the current model and its frames are cached until the key changes. Explicit development geometry has a separate key domain and receipt kind, and never satisfies an ordinary model request.
 *
 * @evidence contracts/common.md#principled-implementation A serialized queue binds source bytes and supplied input SHA to one child lease, verifies publication/frame commitments and rechecks source before delivery.
 * @evidence contracts/common.md#clear-and-simple-design The session owns model/frame reuse; process lifecycle and HTTP historical delivery stay with their separate owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A child failure propagates without recovered mesh, old model or successful empty output; input SHA and runtime parameter validation remain caller responsibilities.
 * @evidence contracts/common.md#meaningful-documentation States isolated ownership, publication reuse and resident-worker replacement.
 * @evidence contracts/performance.md#efficient-algorithms Each admitted operation observes the conservative production inventory; a new model key regenerates in the resident child, and frame hits avoid generation/render commands.
 * @evidence contracts/performance.md#reuse-equivalent-work One model key combines observed source hash and supplied input hash; frames additionally match name and optional fresh nonce, with active-child checks before reuse.
 * @evidence contracts/performance.md#bound-retention-and-release-resources At most sixteen requests queue behind one child, which owns one Chrome; one publication and PNG buffers each have a 256 MiB admission cap, frame names have no separate count cap, and close joins the queue and child before dropping caches.
 */
export class HumanImageSession {
  private queue: Promise<void> = Promise.resolve();
  private worker: HumanImageProcess | undefined;
  private cached:
    | {
        key: string;
        source: string;
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
  private readonly diagrams: Map<
    string,
    { bytes: Buffer; nonce: string | null; capturedUtc: string; sha256: string }
  > = new Map();
  private closed: boolean = false;
  private admittedRequests: number = 0;
  public constructor(private readonly root: string) {}

  /** Actual admitted request population; Integration waits for zero before another heavy lease. */
  public pending(): number { return this.admittedRequests; }

  /** Queue one model/frame request; reject invalid nonces, full queues or closed sessions.
   * The resident child generates and renders in its Chrome page. `curves` joins frame identity; observation selection and explicit geometry stage join execution identity. Geometry inspection preserves the full-generator outcome, while ordinary errors still reject. Input value/SHA consistency is supplied by the caller.
   *
   * @evidence contracts/common.md#principled-implementation The serialized operation observes source/host hashes, derives a model key, verifies worker commitments and refuses source changes before returning publication or frame bytes.
   * @evidence contracts/common.md#clear-and-simple-design One queue protects a model lease and its frame Map while independent archive HTTP reads need no session operation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A worker error rejects without fallback; on-disk source hashes neither validate arbitrary Human inputs nor certify the currently loaded module graph.
   * @evidence contracts/common.md#meaningful-documentation Documents nonce/queue failure, caller SHA responsibility and in-page generation.
   * @evidence contracts/performance.md#efficient-algorithms Production-inventory observation scans its selected bytes; cache hits save child generation/rendering, while PNG byte accounting scans the retained frame Map.
   * @evidence contracts/performance.md#reuse-equivalent-work Source/input/observation key and active child permit model reuse; name and curve selection plus absent or matching nonce permit frame reuse, preserving original capture UTC and PNG SHA.
   * @evidence contracts/performance.md#bound-retention-and-release-resources finally releases each of at most sixteen admission slots; an inactive child is closed before its replacement starts, PNG admission caps retained pixels at 256 MiB, and failures may leave that one child owned until replacement or close.
   */
  public async image(input: Input, name: string, nonce?: string, curves: string = "", view: string = "", observation?: readonly string[], geometry: boolean = false): Promise<Frame> {
    return this.admit((): Promise<Frame> => this.frame(input, name, nonce, curves, view, observation, geometry));
  }

  /** Generate/reuse a model and draw its diagram under ONE queue lease, without nested queue admission.
   * @evidence contracts/common.md#principled-implementation The private frame and draw operations execute serially before this admitted lease releases, so another request cannot replace the required model between them.
   * @evidence contracts/common.md#clear-and-simple-design Shares the same existing child, cache and queue as images; this is orchestration, not another renderer.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Exact source/model keys bind the loaded actual parameters; alias is only a page fallback without a loaded result and never substitutes for one.
   * @evidence contracts/common.md#meaningful-documentation Returns both actual model receipt and diagram receipt, without changing model ownership.
   * @evidence contracts/performance.md#efficient-algorithms One model observation followed by one bounded selected-curve draw; cache hits retain original timestamps.
   * @evidence contracts/performance.md#reuse-equivalent-work Private unqueued primitives avoid duplicate model generation and nested queue deadlock.
   * @evidence contracts/performance.md#bound-retention-and-release-resources One of sixteen admission slots owns the entire operation; finally releases it, and existing child/cache retirement stays unchanged.
   */
  public async modelDiagram(input: Input, alias: string | null, curves: string, format: "png" | "svg", nonce?: string, observation?: readonly string[]): Promise<{ frame: Frame; diagram: Diagram }> {
    return this.admit(async (): Promise<{ frame: Frame; diagram: Diagram }> => {
      const frame: Frame = await this.frame(input, "$model", nonce, curves, "", observation);
      const diagram: Diagram = await this.draw(alias, curves, format, frame.key, nonce);
      return { frame, diagram };
    });
  }

  /** Retire an idle owned capture child through its page/browser API while preserving this host.
   * @evidence contracts/common.md#principled-implementation Requires an idle queue, serializes normal page/browser disposal, observes child inactivity, then joins existing owned cleanup.
   * @evidence contracts/common.md#clear-and-simple-design This is resident-resource retirement; the host and its source identity policy remain unchanged.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No PID kill, external browser, live capture or host-hash reset is used. Missing normal exit rejects without forced retirement.
   * @evidence contracts/common.md#meaningful-documentation The next admitted request acquires one fresh child; changed host implementations still require an explicit normal host reload.
   * @evidence contracts/performance.md#efficient-algorithms One IPC disposal and at most5s bounded inactive observation precede existing directory/thread cleanup.
   * @evidence contracts/performance.md#reuse-equivalent-work Uses the same queue, original child ownership and cleanup rather than a second browser controller.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Successful normal exit drops model/PNG/diagram references and joins the inactive lifecycle thread; uncertainty retains ownership for diagnosis.
   */
  public async releaseIdle(): Promise<{ retired: boolean }> {
    if (this.admittedRequests !== 0) throw new Error("Human idle release requires an empty request queue");
    return this.admit(async (): Promise<{ retired: boolean }> => {
      const worker: HumanImageProcess | undefined = this.worker;
      if (worker !== undefined && worker.isActive()) {
        const reply: Record<string, unknown> = await worker.request({ kind: "retire" });
        if (reply.retired !== true) throw new Error("Owned capture child did not acknowledge normal disposal");
        const deadline: number = Date.now() + 5000;
        while (worker.isActive() && Date.now() < deadline)
          await new Promise<undefined>((resolve: (value: undefined) => void): void => { setTimeout(resolve, 20, undefined); });
        if (worker.isActive()) throw new Error("Owned capture child did not exit normally; ownership retained");
      }
      await worker?.close(); this.worker = undefined; this.cached = undefined; this.diagrams.clear();
      return { retired: worker !== undefined };
    });
  }

  /** Admit one operation; private primitives never re-enter this queue.
 *
 * @evidence contracts/common.md#principled-implementation Appends one operation to the existing promise queue and releases its admission slot in finally.
 * @evidence contracts/common.md#clear-and-simple-design One queue serializes image and atomic model-diagram operations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The16slot cap and closed state reject before work; no nested admission waits on itself.
 * @evidence contracts/common.md#meaningful-documentation Admission does not establish source or model validity; private primitives perform those checks.
 * @evidence contracts/performance.md#efficient-algorithms Constant queue bookkeeping per operation.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the same settled-tail promise after success or failure.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only admitted closures survive until their turn; finally decrements the bounded population.
 */
  private async admit<T>(operation: () => Promise<T>): Promise<T> {
    if (this.closed || this.admittedRequests >= 16) throw new Error("Human image queue is closed or full");
    ++this.admittedRequests;
    const work: Promise<T> = this.queue.then(operation);
    this.queue = work.then((): void => {}).catch((): void => {});
    try { return await work; } finally { --this.admittedRequests; }
  }

  /** Observe actual source/host, generate and optionally capture while the caller owns the queue.
 *
 * @evidence contracts/common.md#principled-implementation Combines current source/input commitments, verifies child publication and PNG hashes, and reobserves source/host before delivery.
 * @evidence contracts/common.md#clear-and-simple-design The private unqueued primitive is shared by image and modelDiagram.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A changed host/source or child error rejects without another model or fake frame.
 * @evidence contracts/common.md#meaningful-documentation Source inventory is conservative; actual input, model and capture identities remain distinct.
 * @evidence contracts/performance.md#efficient-algorithms Hash work is bounded by the source observer; actual image cache accounting scans retained frames.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the exact current model and frame slot when key and nonce permit.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The existing cache/publication caps apply before retention; no independent worker or renderer is acquired.
 */
  private async frame(input: Input, name: string, nonce?: string, curves: string = "", view: string = "", observation?: readonly string[], geometry: boolean = false): Promise<Frame> {
    this.nonce(nonce);
    if (this.closed) throw new Error("Human image server is closing");

    // One frame slot per file name, canonical curve selection and free view.
    const slot: string = name + "|" + curves + "|" + view;

    const host: string = await HumanImageSourceIdentity.host(this.root);
    if (this.hostIdentity !== undefined && host !== this.hostIdentity)
      throw new Error("Human host changed; restart this server");
    this.hostIdentity = host;
    const observe: () => Promise<string> = (): Promise<string> => HumanImageSourceIdentity.source(this.root);
    const source: string = await observe();
    const key: string = createHash("sha256")
      .update(source + input.sha256 + (observation === undefined ? "" : "|observation:" + JSON.stringify([...new Set(observation)].sort((a: string, b: string): number => a < b ? -1 : a > b ? 1 : 0))) + (geometry ? "|geometry" : ""))
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
      cacheHit = false;
      const next: HumanImageProcess = resident;
      const result: Record<string, unknown> = await next.request({
        kind: "generate",
        source,
        key,
        inputSha256: input.sha256,
        value: input.value,
        observation,
        geometry,
      });
      if (
        result.key !== key ||
        result.source !== source ||
        result.inputSha256 !== input.sha256 ||
        result.receipt === null ||
        typeof result.receipt !== "object" ||
        (result.receipt as { kind?: unknown }).kind !== (geometry ? "human-geometry-inspection" : "human-generation")
      )
        throw new Error("Worker generation identity mismatch");
      const publication: Buffer = await next.publication(result);
      if (
        this.closed ||
        (await observe()) !== source
      )
        throw new Error("Human source changed during isolated generation");
      this.cached = {
        key,
        source,
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
      (await observe()) !== source
    ) {
      throw new Error("Human source changed during this request");
    }
    if ((await HumanImageSourceIdentity.host(this.root)) !== host) {
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
  }

  /** Reevaluate the shape law with the exact current model's actual parameters; this is not mesh measurement or stored-jet drawing.
   * @evidence contracts/common.md#principled-implementation Requires current model key/source, sends the same model key to the resident worker and checks returned bytes and source again.
   * @evidence contracts/common.md#clear-and-simple-design This private primitive only runs inside modelDiagram's existing queue lease.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing model, source changes and SHA failures reject; the page uses actual loaded parameters instead of alias substitution.
   * @evidence contracts/common.md#meaningful-documentation Nullable alias is a fallback only without a loaded page result; null then rejects. The diagram reevaluates the law without generating another skin model.
   * @evidence contracts/performance.md#efficient-algorithms Requested law curves are reevaluated only on cache miss, with bounded cache scans.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses actual generated parameters in the resident page and retains at most32 cached diagrams.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Each diagram is capped32MiB and the aggregate cache128MiB before retention; close releases all references.
   */
  private async draw(alias: string | null, curves: string, format: "png" | "svg", modelKey: string, nonce?: string): Promise<Diagram> {
    this.nonce(nonce);
    if (this.closed) throw new Error("Human image server is closing");
    const observe: () => Promise<string> = (): Promise<string> => HumanImageSourceIdentity.source(this.root);
    const source: string = await observe();
    const worker: HumanImageProcess = await this.resident();
    if (this.cached?.key !== modelKey || this.cached.source !== source)
      throw new Error("Human construction diagram requires the same current generated model");
    const key: string = createHash("sha256")
      .update(JSON.stringify([source, modelKey, alias, curves, format]))
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
      const result: Record<string, unknown> = await worker.request({
        kind: "diagram",
        source,
        key,
        modelKey,
        alias,
        curves,
        format,
      });
      if (result.modelKey !== modelKey) throw new Error("Worker diagram belongs to another actual generation");

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
      const retained: number = [...this.diagrams.entries()].reduce((sum: number, entry: [string, { bytes: Buffer }]): number => sum + (entry[0] === key ? 0 : entry[1].bytes.length), 0);
      if (bytes.length > 32 * 1024 * 1024 || retained + bytes.length > 128 * 1024 * 1024) throw new Error("Human diagram byte cache budget exceeded");
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
    if ((await observe()) !== source || (await HumanImageSourceIdentity.host(this.root)) !== this.hostIdentity) {
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
        modelKey,
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
  }

  /** Reject malformed nonce input before native work, including already-admitted operations.
 *
 * @evidence contracts/common.md#principled-implementation Uses the one-to64safe-character grammar before frame or diagram work.
 * @evidence contracts/common.md#clear-and-simple-design One private validator serves both unqueued primitives.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A bad nonce fails explicitly rather than becoming a cache hit or omitted freshness request.
 * @evidence contracts/common.md#meaningful-documentation A valid nonce requests a new draw but proves no geometry or source identity.
 * @evidence contracts/performance.md#efficient-algorithms Linear in at most64characters.
 * @evidence contracts/performance.md#reuse-equivalent-work Shared by both frame and diagram primitives.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains no state or resource.
 */
  private nonce(value: string | undefined): void {
    if (value !== undefined && !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(value)) throw new Error("Fresh nonce requires one to sixty-four safe characters");
  }
  /** The active resident worker, replacing an inactive one (which forgets the model cache). */
  private async resident(): Promise<HumanImageProcess> {
    if (this.worker !== undefined && !this.worker.isActive()) {
      // A dead or failed child (for example a Chrome crash) is retired and
      // its model forgotten; the next step starts a fresh one.
      await this.worker.close();
      this.worker = undefined;
    }
    if (this.worker === undefined) {
      if (this.closed)
        throw new Error("Human image server closed during worker retirement");

      // A new process cannot own the previous process's resident model or frames.
      // Admission failure in a live process takes a separate path and preserves them.
      this.cached = undefined;
      this.diagrams.clear();

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
  }
}
