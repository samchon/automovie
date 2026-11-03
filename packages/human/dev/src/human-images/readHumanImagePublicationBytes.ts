import { webcrypto } from "node:crypto";
import fs from "node:fs/promises";

/** Read the owned publication file and verify its declared bytes and SHA-256.
 *
 * @param filename Original lifecycle owner's publication path; undefined refuses the read.
 * @param record Actual worker publication path, byte count and SHA-256.
 * @evidence contracts/common.md#principled-implementation The record must name the borrowed owner's publication file with a positive declared size at most 256 MiB; actual bytes and asynchronous SHA must match.
 * @evidence contracts/common.md#clear-and-simple-design File publication avoids transferring a parsed geometry graph over IPC.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A path, size or SHA mismatch rejects; no earlier publication substitutes for a failed one.
 * @evidence contracts/common.md#meaningful-documentation Documents owned-path admission and exact byte/hash verification.
 * @evidence contracts/performance.md#efficient-algorithms One asynchronous read and SHA pass cost O(B); the declared 256 MiB cap precedes reading, but a changed larger file is allocated before actual-length rejection.
 * @evidence contracts/performance.md#reuse-equivalent-work Each read verifies current bytes; the session owns reuse of a successfully verified publication.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned Buffer belongs to the ordinary session; the process owner removes its publication file during close. Mannequin frames do not use this publication path.
 */
export async function readHumanImagePublicationBytes(
  filename: string | undefined,
  record: Record<string, unknown>,
): Promise<Buffer> {
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
