import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { Transform, Writable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createGunzip, createGzip } from "node:zlib";

import type { IAutoMovieRecoveryArchiveInput } from "../../structures/node/IAutoMovieRecoveryArchiveInput";
import type { IAutoMovieRecoveryArchivedModel } from "../../structures/node/IAutoMovieRecoveryArchivedModel";

/**
 * Store one run-owned final model as verified, lossless gzip bytes.
 * The input path must resolve to output/model.json and its exact published byte
 * count and SHA-256 must be supplied. The archive is published without replacing
 * an existing file after a complete reverse decode verifies the logical bytes.
 * A receipt precedes retirement of this model and its recognized array spool.
 * Failure preserves the raw publication; an already published archive or receipt
 * may remain when a later filesystem operation fails. Process termination may
 * leave an unpublished temporary archive. The caller owns exclusive output access.
 *
 * @evidence contracts/common.md#principled-implementation Streaming gzip preserves the complete UTF-8 publication, whose supplied hash is checked during encoding and independently checked after full reverse decoding before hard-link publication and raw retirement.
 * @evidence contracts/common.md#clear-and-simple-design This storage owner handles compression, byte identity, publication and the same run's served spool. Numerical reconstruction retains every geometry and completion decision.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No parsing, coefficient change, mesh filtering, source fallback or existing-output replacement occurs. Only model.json directly within the resolved output and recognized plain spool files are eligible for retirement.
 * @evidence contracts/common.md#meaningful-documentation States exclusive output ownership, exact input binding, immutable publication, reverse verification, retirement order and failure effects.
 * @evidence contracts/performance.md#efficient-algorithms Encoding scans N logical bytes once and reverse verification scans M compressed bytes once, with O(N + M) codec work and O(F) spool metadata for F served files. Full decoding is required to verify the stored logical publication.
 * @evidence contracts/performance.md#reuse-equivalent-work The encoding pass computes both logical and compressed hashes. The returned archive record is the same record written to the storage receipt and supports later verified streaming transport.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Node stream backpressure bounds codec staging independently of model size; spool paths retain O(F) metadata. Pipeline closes streams on completion or failure, and finally removes only this call's unpublished temporary archive. No source input or prior publication is retired.
 */
export async function archiveAutoMovieRecoveryModel(
  input: IAutoMovieRecoveryArchiveInput,
): Promise<IAutoMovieRecoveryArchivedModel> {
  const root: string = fs.realpathSync(input.output);
  const model: string = fs.realpathSync(input.path);
  if (path.dirname(model) !== root || path.basename(model) !== "model.json")
    throw new Error("Only this run-owned final model can be archived");
  if (
    !Number.isSafeInteger(input.bytes) ||
    input.bytes < 0 ||
    !/^[a-f0-9]{64}$/i.test(input.sha256)
  )
    throw new Error("A final model requires its exact byte count and SHA-256");
  const destination: string = model + ".gz";
  const temporary: string = destination + ".tmp";
  const logicalHash: ReturnType<typeof createHash> = createHash("sha256");
  const physicalHash: ReturnType<typeof createHash> = createHash("sha256");
  let logicalBytes: number = 0;
  let physicalBytes: number = 0;
  let temporaryOwned: boolean = false;
  const descriptor: number = fs.openSync(temporary, "wx");
  temporaryOwned = true;
  try {
    await pipeline(
      fs.createReadStream(model),
      new Transform({
        transform(
          chunk: Buffer,
          _encoding: BufferEncoding,
          done: (error?: Error | null, data?: Buffer) => void,
        ): void {
          logicalHash.update(chunk);
          logicalBytes += chunk.length;
          done(null, chunk);
        },
      }),
      createGzip({ level: 6 }),
      new Transform({
        transform(
          chunk: Buffer,
          _encoding: BufferEncoding,
          done: (error?: Error | null, data?: Buffer) => void,
        ): void {
          physicalHash.update(chunk);
          physicalBytes += chunk.length;
          done(null, chunk);
        },
      }),
      fs.createWriteStream(temporary, { fd: descriptor, autoClose: true }),
    );
    const actualLogical: string = logicalHash.digest("hex");
    if (
      logicalBytes !== input.bytes ||
      actualLogical !== input.sha256.toLowerCase()
    )
      throw new Error("The final model changed during lossless archiving");
    const decoded: ReturnType<typeof createHash> = createHash("sha256");
    let decodedBytes: number = 0;
    await pipeline(
      fs.createReadStream(temporary),
      createGunzip(),
      new Writable({
        write(
          chunk: Buffer,
          _encoding: BufferEncoding,
          done: (error?: Error | null) => void,
        ): void {
          decoded.update(chunk);
          decodedBytes += chunk.length;
          done();
        },
      }),
    );
    if (
      decodedBytes !== logicalBytes ||
      decoded.digest("hex") !== actualLogical
    )
      throw new Error("Lossless model reverse-decode differs");
    const spool: string = model + ".spool";
    const removed: { path: string; bytes: number }[] = [];
    if (fs.existsSync(spool)) {
      if (fs.realpathSync(spool) !== spool || path.dirname(spool) !== root)
        throw new Error("The served spool leaves this run-owned output");
      for (const entry of fs.readdirSync(spool, { withFileTypes: true })) {
        if (
          !entry.isFile() ||
          !/^(positions|normals|indices|sources|vertices|construction|ownership)\.\d+\.json$/.test(
            entry.name,
          )
        )
          throw new Error("An unowned object appears in the served spool");
        const file: string = path.join(spool, entry.name);
        removed.push({ path: file, bytes: fs.statSync(file).size });
      }
    }
    fs.linkSync(temporary, destination);
    fs.unlinkSync(temporary);
    temporaryOwned = false;
    const archive: IAutoMovieRecoveryArchivedModel = {
      path: destination,
      codec: "gzip",
      bytes: physicalBytes,
      sha256: physicalHash.digest("hex"),
      logicalBytes,
      logicalSha256: actualLogical,
    };
    fs.writeFileSync(
      path.join(root, "model-storage-receipt.json"),
      JSON.stringify(
        {
          schema: "verified-lossless-model-storage-v1",
          rawPublication: {
            path: model,
            bytes: logicalBytes,
            sha256: actualLogical,
          },
          archive,
          reverseDecodeVerified: true,
          servedSpool: {
            path: spool,
            files: removed.length,
            bytes: removed.reduce(
              (sum: number, row: { bytes: number }): number => sum + row.bytes,
              0,
            ),
          },
          sourceInputDeletion: 0,
          priorEpochDeletion: 0,
        },
        null,
        2,
      ),
      { flag: "wx" },
    );
    for (const row of removed) fs.unlinkSync(row.path);
    if (fs.existsSync(spool)) fs.rmdirSync(spool);
    fs.unlinkSync(model);
    return archive;
  } finally {
    if (temporaryOwned && fs.existsSync(temporary)) fs.unlinkSync(temporary);
  }
}
