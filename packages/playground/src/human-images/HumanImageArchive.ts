import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

/** Retain at most sixteen historical PNG/receipt publications within 64 MiB.
 * Captured pixels and original producer records are copied, never regenerated.
 * URLs identify capture records, not the current source/model generation. Old
 * entries expire explicitly; an absent immutable URL never triggers rendering.
 * @evidence contracts/common.md#principled-implementation Admission verifies exact PNG/event bytes and their original alias, frame, nonce, capture UTC, generation key and PNG SHA commitments.
 * @evidence contracts/common.md#clear-and-simple-design This owner stores immutable HTTP artifacts only; the existing session alone generates geometry and pixels.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No UTC rewriting, new-source promotion, model copy, mesh fallback or rendering is performed.
 * @evidence contracts/common.md#meaningful-documentation States historical qualification, strict audit versus mixed-retention admission, count/byte budgets and explicit expiration.
 * @evidence contracts/performance.md#efficient-algorithms Digest-addressed lookup delivers retained bytes without source scanning, generation or GPU work.
 * @evidence contracts/performance.md#reuse-equivalent-work One captured PNG and producer receipt serve repeated image/receipt URLs with their original capture identity.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Sixteen entries and 64 MiB bound retention; FIFO expiration and close drop buffers. Imports atomically admit either a strict complete eight-image audit or one to sixteen already captured mixed-retention artifacts.
 */
export class HumanImageArchive {
  private readonly entries: Map<
    string,
    {
      id: string;
      png: Buffer;
      receipt: Buffer;
      summary: Record<string, string>;
    }
  > = new Map();
  private retainedBytes: number = 0;
  private closed: boolean = false;

  /** Verify an eight-frame audit or one to sixteen historical captures before admission.
   * Paths must stay beside the manifest. Captured times and producer records remain original.
   * Failure before commit leaves the archive unchanged; publication does not prove current-source fit.
   *
   * @evidence contracts/common.md#principled-implementation Member size, SHA-256, regular-file boundary and producer commitments are checked before FIFO admission; strict audits additionally require four aliases front/back.
   * @evidence contracts/common.md#clear-and-simple-design Import prepares the whole manifest before the same commit path used by live publication.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Mixed retention preserves historical qualification and never substitutes for complete audit coverage or new rendering.
   * @evidence contracts/common.md#meaningful-documentation Documents accepted populations, path confinement, original timestamps and precommit failure effects.
   * @evidence contracts/performance.md#efficient-algorithms Work scales with actual file bytes read for at most sixteen PNG/event pairs plus initial and final manifest reads; declared member caps precede reads, but actual sizes are checked only after full allocation.
   * @evidence contracts/performance.md#reuse-equivalent-work Exact capture IDs reuse retained entries; each import still verifies current file bytes rather than trusting paths or timestamps.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Accepted prepared PNG/receipt buffers and retained archive each have a 64 MiB budget, not a peak-allocation bound; manifests and invalid or concurrently enlarged files can allocate more before rejection. Local buffers expire after return or failure; FIFO retains at most sixteen entries.
   */
  public async import(filename: string): Promise<void> {
    const original: Buffer = await fs.readFile(filename);
    if (original.length > 1_048_576)
      throw new Error("Human audit manifest exceeds one MiB");
    const manifest: {
      schema: string;
      entries: {
        alias?: string;
        frame: string;
        originalUrl: string;
        receiptPointer: string;
        png: { path: string; bytes: number; sha256: string };
        responseEvent: { path: string; bytes: number; sha256: string };
      }[];
    } = JSON.parse(original.toString("utf8"));
    const audit: boolean = manifest.schema === "human-audit-artifact-import-v1";
    const mixed: boolean =
      manifest.schema === "human-historical-retention-import-v1";
    if (
      !Array.isArray(manifest.entries) ||
      (audit && manifest.entries.length !== 8) ||
      (mixed &&
        (manifest.entries.length < 1 || manifest.entries.length > 16)) ||
      (!audit && !mixed)
    )
      throw new Error(
        "Expected a complete eight-frame audit or one to sixteen explicit historical retention entries",
      );
    const base: string = await fs.realpath(path.dirname(filename));
    const prepared: ReturnType<HumanImageArchive["qualify"]>[] = [];
    const required: Set<string> = new Set(
      ["f1", "f2", "m1", "m2"].flatMap((alias: string): string[] => [
        alias + "/whole-front.surface.png",
        alias + "/whole-back.surface.png",
      ]),
    );
    const identities: Set<string> = new Set();
    let preparedBytes: number = 0;
    for (const entry of manifest.entries) {
      if (
        entry.receiptPointer !== "/receipt" ||
        (audit && !required.delete(entry.alias + "/" + entry.frame))
      )
        throw new Error(
          "Audit import has duplicate or unsupported alias/frame coverage",
        );
      const png: Buffer = await member(entry.png);
      const event: Buffer = await member(entry.responseEvent);
      const producer: { alias?: string; image?: string } = JSON.parse(
        event.toString("utf8"),
      );
      if (producer.alias !== entry.alias || producer.image !== entry.frame)
        throw new Error("Audit manifest and original producer identity differ");
      const qualified: ReturnType<HumanImageArchive["qualify"]> = this.qualify(
        entry.originalUrl,
        png,
        event,
        {
          kind: audit ? "read-only-import" : "read-only-mixed-retention-import",
          manifestSha256: digest(original),
          responseEventSha256: entry.responseEvent.sha256,
          receiptPointer: entry.receiptPointer,
        },
      );
      if (identities.has(qualified.id))
        throw new Error(
          "Historical retention import repeats an exact captured identity",
        );
      identities.add(qualified.id);
      preparedBytes += qualified.png.length + qualified.receipt.length;
      if (preparedBytes > 67_108_864)
        throw new Error("Historical import exceeds the archive byte budget");
      prepared.push(qualified);
    }
    if (
      (audit && required.size) ||
      digest(await fs.readFile(filename)) !== digest(original)
    )
      throw new Error(
        "Historical import changed or audit coverage is incomplete",
      );
    for (const entry of prepared) this.commit(entry);

    /** Constrain import members to regular files beside the manifest. */
    async function member(identity: {
      path: string;
      bytes: number;
      sha256: string;
    }): Promise<Buffer> {
      if (
        !Number.isSafeInteger(identity.bytes) ||
        identity.bytes < 1 ||
        identity.bytes > 8_388_608 ||
        !/^[a-f0-9]{64}$/.test(identity.sha256)
      )
        throw new Error("Invalid audit member identity");
      const filename: string = path.resolve(base, identity.path);
      const resolved: string = await fs.realpath(filename);
      const relative: string = path.relative(base, resolved);
      const stat: Awaited<ReturnType<typeof fs.lstat>> =
        await fs.lstat(filename);
      if (
        !stat.isFile() ||
        stat.isSymbolicLink() ||
        relative.startsWith("..") ||
        path.isAbsolute(relative)
      )
        throw new Error(
          "Audit member escapes its declared publication directory",
        );
      const bytes: Buffer = await fs.readFile(filename);
      if (bytes.length !== identity.bytes || digest(bytes) !== identity.sha256)
        throw new Error("Published audit member bytes changed");
      return bytes;
    }
  }

  /** Admit a producer PNG and receipt, returning its historical archive URL.
   *
   * @evidence contracts/common.md#principled-implementation Qualification verifies PNG bytes, SHA commitments, frame, key, nonce and original capture time before deriving a capture ID.
   * @evidence contracts/common.md#clear-and-simple-design Live responses use the same qualification and bounded commit path as imports.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A cache-hit event is refused; no rendering or timestamp rewriting creates an archive entry.
   * @evidence contracts/common.md#meaningful-documentation States producer admission and the historical meaning of the returned URL.
   * @evidence contracts/performance.md#efficient-algorithms Hashing and receipt serialization scale with supplied bytes; eviction visits at most sixteen entries and performs no GPU work.
   * @evidence contracts/performance.md#reuse-equivalent-work The exact key/frame/nonce/time/PNG hash tuple identifies duplicate captures for no-op commits.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The archive borrows the PNG buffer, owns its receipt buffer and retains at most sixteen entries within 64 MiB until FIFO eviction or close; callers must not mutate borrowed bytes.
   */
  public publish(
    originalUrl: string,
    png: Buffer,
    responseEvent: Buffer,
  ): string {
    const entry: ReturnType<HumanImageArchive["qualify"]> = this.qualify(
      originalUrl,
      png,
      responseEvent,
      { kind: "live-producer", responseEventSha256: digest(responseEvent) },
    );
    this.commit(entry);
    return entry.summary.url!;
  }

  /** Borrow retained PNG, receipt and summary references; callers must not mutate them.
   *
   * @evidence contracts/common.md#principled-implementation A capture-ID Map lookup returns the admitted entry or undefined without consulting current inputs.
   * @evidence contracts/common.md#clear-and-simple-design HTTP delivery borrows the archive entry directly; generation stays outside this owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A miss never renders replacement pixels or changes capture identity.
   * @evidence contracts/common.md#meaningful-documentation Documents borrowed references, caller immutability and absence semantics.
   * @evidence contracts/performance.md#efficient-algorithms Expected constant-time lookup allocates no PNG or receipt copy.
   * @evidence contracts/performance.md#reuse-equivalent-work Repeated IDs share exactly the retained bytes and original receipt.
   * @evidence contracts/performance.md#bound-retention-and-release-resources This lookup adds no archive entry or handle; caller-held references can outlive archive eviction and are outside its memory budget.
   */
  public read(
    id: string,
  ):
    | { png: Buffer; receipt: Buffer; summary: Record<string, string> }
    | undefined {
    return this.entries.get(id);
  }

  /** Borrow the newest retained entry matching an original URL path and fresh nonce.
   * URL origins and other query fields do not select capture identity.
   *
   * @evidence contracts/common.md#principled-implementation Reverse insertion-order search compares normalized pathname and fresh nonce against qualified producer URLs.
   * @evidence contracts/common.md#clear-and-simple-design Original request lookup and immutable capture-ID lookup share the same retained entries.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Lookup returns historical bytes only and cannot establish current-source equivalence.
   * @evidence contracts/common.md#meaningful-documentation States newest-match order, path/nonce matching and the ignored URL components.
   * @evidence contracts/performance.md#efficient-algorithms Search and its temporary reference array are linear in the archive's maximum sixteen entries.
   * @evidence contracts/performance.md#reuse-equivalent-work Matching requests borrow the existing entry rather than duplicating PNGs or rendering.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary URL objects and references expire after lookup; caller-held entry references remain outside the archive's retention bound.
   */
  public find(
    originalUrl: string,
  ):
    | { png: Buffer; receipt: Buffer; summary: Record<string, string> }
    | undefined {
    const requested: URL = new URL(originalUrl, "http://localhost");
    return [...this.entries.values()]
      .reverse()
      .find((entry: ReturnType<HumanImageArchive["qualify"]>): boolean => {
        const original: URL = new URL(entry.summary.originalUrl!);
        return (
          original.pathname === requested.pathname &&
          original.searchParams.get("fresh") ===
            requested.searchParams.get("fresh")
        );
      });
  }

  /** List historical summaries in admission order; summary objects remain borrowed.
   *
   * @evidence contracts/common.md#principled-implementation Map insertion order yields the summaries of currently retained capture IDs.
   * @evidence contracts/common.md#clear-and-simple-design The index exposes delivery metadata without reading files or generating models.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Historical summaries do not assert current-source fit or a fresh audit round.
   * @evidence contracts/common.md#meaningful-documentation Documents historical qualification, ordering and borrowed summary ownership.
   * @evidence contracts/performance.md#efficient-algorithms Listing allocates one reference array of at most sixteen summaries, without copying PNGs.
   * @evidence contracts/performance.md#reuse-equivalent-work Index entries refer to the same admitted capture records used by delivery.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only the returned array is new; its caller owns its lifetime and must not mutate shared summary objects.
   */
  public index(): readonly Record<string, string>[] {
    return [...this.entries.values()].map(
      (
        entry: ReturnType<HumanImageArchive["qualify"]>,
      ): Record<string, string> => entry.summary,
    );
  }

  /** Close admission and release archive references when the hosting server closes.
   *
   * @evidence contracts/common.md#principled-implementation The closed flag rejects later commits and Map clearing releases the archive's retained entries.
   * @evidence contracts/common.md#clear-and-simple-design One synchronous close owns archive retirement without affecting generator or HTTP ownership.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Closing neither deletes original files nor claims external borrowed buffers were reclaimed.
   * @evidence contracts/common.md#meaningful-documentation States admission closure and the scope of released references.
   * @evidence contracts/performance.md#efficient-algorithms Clearing at most sixteen entries requires no file scan or native operation.
   * @evidence contracts/performance.md#reuse-equivalent-work Repeated close calls leave the same empty, closed archive.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The archive drops all PNG/receipt references and resets accounting; previously returned references remain caller-owned.
   */
  public close(): void {
    this.closed = true;
    this.entries.clear();
    this.retainedBytes = 0;
  }

  /** Keep an original producer record intact inside a historical-delivery wrapper. */
  private qualify(
    originalUrl: string,
    png: Buffer,
    eventBytes: Buffer,
    proof: object,
  ): {
    id: string;
    png: Buffer;
    receipt: Buffer;
    summary: Record<string, string>;
  } {
    const event: {
      kind: string;
      alias?: string;
      image: string;
      key: string;
      cacheHit: boolean;
      receipt: {
        key: string;
        inputSha256: string;
        sourceSha256: string;
        modelSha256: string;
        constructionSha256: string;
        frame: string;
        capture: { nonce: string; capturedUtc: string; pngSha256: string };
      };
    } = JSON.parse(eventBytes.toString("utf8"));
    const url: URL = new URL(originalUrl, "http://localhost");
    const capture: typeof event.receipt.capture = event.receipt.capture;
    const hashes: string[] = [
      event.key,
      event.receipt.key,
      event.receipt.inputSha256,
      event.receipt.sourceSha256,
      event.receipt.modelSha256,
      event.receipt.constructionSha256,
      capture.pngSha256,
    ];
    if (
      event.kind !== "human-image-response" ||
      event.cacheHit ||
      event.key !== event.receipt.key ||
      event.image !== event.receipt.frame ||
      !hashes.every(
        (value: string): boolean =>
          typeof value === "string" && /^[a-f0-9]{64}$/.test(value),
      ) ||
      !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(capture.nonce) ||
      url.searchParams.get("fresh") !== capture.nonce ||
      !Number.isFinite(Date.parse(capture.capturedUtc)) ||
      digest(png) !== capture.pngSha256 ||
      png.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a"
    )
      throw new Error(
        "Historical capture does not match its original producer commitments",
      );
    const aliasPath: string =
      "/human-images/" + event.alias + "/" + event.image;
    const pinnedPath: string =
      "/human-images/current/" + event.key + "/" + event.image;
    if (url.pathname !== aliasPath && url.pathname !== pinnedPath)
      throw new Error("Historical URL and producer frame differ");
    const id: string = digest(
      Buffer.from(
        JSON.stringify([
          event.key,
          event.image,
          capture.nonce,
          capture.capturedUtc,
          capture.pngSha256,
        ]),
      ),
    );
    const summary: Record<string, string> = {
      id,
      alias: event.alias ?? "current",
      frame: event.image,
      url: "/human-images/archive/" + id + ".png",
      originalUrl: url.href,
      key: event.key,
      capturedUtc: capture.capturedUtc,
      pngSha256: capture.pngSha256,
      binding: "historical-generation",
    };
    const receipt: Buffer = Buffer.from(
      JSON.stringify({
        schema: "human-audit-historical-publication-v1",
        meaning:
          "Historical captured pixels, not a new rendering or current-source generation",
        publication: summary,
        proof,
        originalResponse: event,
      }),
    );
    return { id, png, receipt, summary };
  }

  /** FIFO expiration bounds bytes and count without ever regenerating an old URL. */
  private commit(entry: ReturnType<HumanImageArchive["qualify"]>): void {
    if (this.closed) throw new Error("Human historical archive is closed");
    if (this.entries.has(entry.id)) return;
    const bytes: number = entry.png.length + entry.receipt.length;
    if (bytes > 67_108_864)
      throw new Error("Historical frame exceeds its archive budget");
    while (this.entries.size >= 16 || this.retainedBytes + bytes > 67_108_864) {
      const first: string | undefined = this.entries.keys().next().value;
      if (first === undefined) break;
      const previous: ReturnType<HumanImageArchive["qualify"]> =
        this.entries.get(first)!;
      this.retainedBytes -= previous.png.length + previous.receipt.length;
      this.entries.delete(first);
    }
    this.entries.set(entry.id, entry);
    this.retainedBytes += bytes;
  }
}

/** Compute SHA-256 over exact bytes; the synchronous hash retains no cache. */
function digest(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}
