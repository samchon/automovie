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

  /** Verify historical HTTP artifacts without modifying files or claiming a new audit.
   * The audit schema still requires all four people front/back. The distinct
   * mixed-retention schema restores one to sixteen exact original captures;
   * it proves no complete round or fresh rendering, regardless of entry count.
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

  /** Publish one successful fresh response using its exact original log record. */
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

  /** Return retained historical bytes; a miss never invokes the generator. */
  public read(
    id: string,
  ):
    | { png: Buffer; receipt: Buffer; summary: Record<string, string> }
    | undefined {
    return this.entries.get(id);
  }

  /** Find an exact original path/nonce capture independent of current parameters. */
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

  /** List the bounded historical publications without claiming current-source fit. */
  public index(): readonly Record<string, string>[] {
    return [...this.entries.values()].map(
      (
        entry: ReturnType<HumanImageArchive["qualify"]>,
      ): Record<string, string> => entry.summary,
    );
  }

  /** Drop owned buffers when the hosting server closes. */
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

/** Compute the exact SHA-256 commitment of retained publication bytes.
 * @evidence contracts/common.md#principled-implementation Uses Node SHA-256 over the supplied exact Buffer bytes.
 * @evidence contracts/common.md#clear-and-simple-design One digest helper binds imported and retained artifacts.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither filename nor timestamps substitute for content identity.
 * @evidence contracts/common.md#meaningful-documentation States the exact byte commitment and algorithm.
 * @evidence contracts/performance.md#efficient-algorithms Hashing is linear in the bounded artifact bytes.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each caller establishes a distinct content commitment; retention belongs to the archive.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One local hash handle is finalized synchronously and retains no application cache.
 */
function digest(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}
