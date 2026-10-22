import { createHash, randomUUID, webcrypto } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

/** Preserve served PNG bytes and their producer receipt for local image reports.
 * Publications live below playground/.shots, outside the reference inventory.
 * Capture identity includes the original model, frame, nonce, UTC and PNG SHA;
 * revisiting a capture reuses its files without claiming another rendering.
 * Files are retained as report evidence until explicitly removed by the user.
 *
 * @evidence contracts/common.md#principled-implementation Exact producer hashes and capture identity qualify the supplied native PNG before atomic, non-overwriting publication.
 * @evidence contracts/common.md#clear-and-simple-design This owner only preserves existing response bytes; the session remains the sole renderer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No screenshot, rendering, UTC rewriting or source fallback creates report files.
 * @evidence contracts/common.md#meaningful-documentation States report location, original capture meaning, explicit retention and failure behavior.
 * @evidence contracts/performance.md#efficient-algorithms Asynchronous hashing and file IO are linear in the bounded PNG and receipt sizes, without geometry loading.
 * @evidence contracts/performance.md#reuse-equivalent-work Immutable capture identity reuses matching published bytes; conflicting bytes and unsafe paths fail explicitly.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No memory cache is retained; temporary files are removed on every exit. Report evidence grows with distinct captures and has no automatic disk eviction.
 */
export class HumanImageLocalPublication {
  /** Save an existing PNG and exact receipt; return paths only after both exist.
   * A save failure rejects the response instead of exposing a nonexistent file.
   * The receipt's capturedUtc remains the rendering time; savedUtc is separate.
   */
  public static async save(
    repository: string,
    png: Buffer,
    receipt: Record<string, unknown>,
    alias: string | undefined,
    originalUrl: string,
  ): Promise<{
    pngPath: string;
    receiptPath: string;
    capturedUtc: string;
    pngSha256: string;
  }> {
    const capture: {
      nonce?: unknown;
      capturedUtc?: unknown;
      pngSha256?: unknown;
    } = receipt.capture as typeof capture;
    const frame: string = String(receipt.frame);
    const key: string = String(receipt.key);
    if (
      png.length < 8 ||
      png.length > 33_554_432 ||
      png.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a"
    )
      throw new Error(
        "Local Human publication requires bounded original PNG bytes",
      );
    if (
      !/^(?:whole-(?:front|back|left|right|oblique-front|oblique-back)|region-row[0-3]-(?:front|side))\.(?:surface|overlay|construction)\.png$/.test(
        frame,
      )
    )
      throw new Error("Invalid local Human frame");
    if (alias !== undefined && !/^[a-z][a-z0-9-]{0,15}$/.test(alias))
      throw new Error("Invalid local Human alias");
    const hashes: unknown[] = [
      receipt.key,
      receipt.inputSha256,
      receipt.sourceSha256,
      receipt.modelSha256,
      receipt.constructionSha256,
      capture?.pngSha256,
    ];
    if (
      !hashes.every(
        (value: unknown): boolean =>
          typeof value === "string" && /^[a-f0-9]{64}$/.test(value),
      ) ||
      typeof capture?.capturedUtc !== "string" ||
      !Number.isFinite(Date.parse(capture.capturedUtc)) ||
      (capture.nonce !== null &&
        capture.nonce !== undefined &&
        (typeof capture.nonce !== "string" ||
          !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(capture.nonce)))
    )
      throw new Error("Local Human publication lacks producer commitments");
    if (!(png.buffer instanceof ArrayBuffer))
      throw new Error("Local Human PNG must own ordinary transfer bytes");
    const view: Uint8Array<ArrayBuffer> = new Uint8Array(
      png.buffer,
      png.byteOffset,
      png.byteLength,
    );
    const pngSha256: string = Buffer.from(
      await webcrypto.subtle.digest("SHA-256", view),
    ).toString("hex");
    if (pngSha256 !== capture.pngSha256)
      throw new Error("Local Human PNG differs from its producer SHA");
    const id: string = createHash("sha256")
      .update(
        JSON.stringify([
          key,
          frame,
          capture.nonce ?? null,
          capture.capturedUtc,
          pngSha256,
        ]),
      )
      .digest("hex");
    const playground: string = await fs.realpath(
      path.join(repository, "packages/playground"),
    );
    const base: string = path.join(playground, ".shots");
    await fs.mkdir(base, { recursive: true });
    if ((await fs.realpath(base)) !== base)
      throw new Error(
        "Local Human report directory must not redirect elsewhere",
      );
    const directory: string = path.join(base, id);
    await fs.mkdir(directory, { recursive: true });
    if ((await fs.realpath(directory)) !== directory)
      throw new Error(
        "Local Human capture directory must not redirect elsewhere",
      );
    const pngPath: string = path.join(
      directory,
      (alias ?? "current") + "-" + frame,
    );
    const receiptPath: string = pngPath + ".json";
    const metadata: Buffer = Buffer.from(
      JSON.stringify({
        schema: "human-local-image-publication-v1",
        captureId: id,
        originalUrl,
        alias: alias ?? "current",
        frame,
        key,
        capturedUtc: capture.capturedUtc,
        savedUtc: new Date().toISOString(),
        pngSha256,
        pngPath,
        receiptPath,
        originalReceipt: receipt,
      }),
    );
    if (metadata.length > 4_194_304)
      throw new Error("Local Human producer receipt exceeds four MiB");
    await HumanImageLocalPublication.publish(pngPath, png);
    // Delivery/cache flags are not capture identity. Keep the first exact
    // producer receipt, and qualify existing sidecars by stable commitments.
    const existing: Buffer | undefined =
      await HumanImageLocalPublication.existing(receiptPath);
    if (existing === undefined)
      await HumanImageLocalPublication.publish(receiptPath, metadata, true);
    const preserved: Record<string, unknown> = JSON.parse(
      (await fs.readFile(receiptPath)).toString("utf8"),
    );
    if (
      preserved.captureId !== id ||
      preserved.pngSha256 !== pngSha256 ||
      preserved.capturedUtc !== capture.capturedUtc ||
      preserved.pngPath !== pngPath ||
      preserved.key !== key ||
      preserved.frame !== frame
    )
      throw new Error(
        "Local Human producer receipt conflicts with its capture",
      );
    const producer: Record<string, unknown> =
      preserved.originalReceipt as Record<string, unknown>;
    if (
      !producer ||
      [
        "key",
        "frame",
        "inputSha256",
        "sourceSha256",
        "modelSha256",
        "constructionSha256",
      ].some((name: string): boolean => producer[name] !== receipt[name]) ||
      JSON.stringify(producer.capture) !== JSON.stringify(receipt.capture)
    )
      throw new Error("Local Human sidecar changed producer commitments");
    return {
      pngPath,
      receiptPath,
      capturedUtc: capture.capturedUtc,
      pngSha256,
    };
  }

  /** Read only a regular publication; links cannot redirect report IO. */
  private static async existing(filename: string): Promise<Buffer | undefined> {
    try {
      const stat: Awaited<ReturnType<typeof fs.lstat>> =
        await fs.lstat(filename);
      if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 33_554_432)
        throw new Error("Invalid existing Human report file");
      return await fs.readFile(filename);
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
      throw error;
    }
  }

  /** Link complete temporary bytes into an absent target without overwriting.
   * A concurrent writer may win; PNG bytes must still agree exactly. Sidecar
   * races are qualified against stable capture commitments by the caller.
   */
  private static async publish(
    filename: string,
    bytes: Buffer,
    sidecar: boolean = false,
  ): Promise<void> {
    const previous: Buffer | undefined =
      await HumanImageLocalPublication.existing(filename);
    if (previous !== undefined) {
      if (!sidecar && !previous.equals(bytes))
        throw new Error("Existing Human report bytes conflict");
      return;
    }
    const temporary: string = filename + "." + randomUUID() + ".tmp";
    try {
      await fs.writeFile(temporary, bytes, { flag: "wx" });
      try {
        await fs.link(temporary, filename);
      } catch (error: unknown) {
        if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      }
      const committed: Buffer | undefined =
        await HumanImageLocalPublication.existing(filename);
      if (committed === undefined || (!sidecar && !committed.equals(bytes)))
        throw new Error(
          "Human report publication did not preserve exact bytes",
        );
    } finally {
      await fs.rm(temporary, { force: true });
    }
  }
}
