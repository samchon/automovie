import { webcrypto } from "node:crypto";
import fs from "node:fs/promises";

import { HumanImagePublication } from "./HumanImagePublication.ts";

/** Read the owned publication file and verify its declared bytes and SHA-256.
 *
 * @param filename Original lifecycle owner's publication path; undefined refuses the read.
 * @param record Actual worker publication path, byte count and SHA-256.
 * @evidence contracts/common.md#principled-implementation The record must name the borrowed owner's publication file and Float32/canonical domains with a positive declared size at most 256 MiB; one opened regular file must match its bounded byte read and asynchronous SHA.
 * @evidence contracts/common.md#clear-and-simple-design File publication avoids transferring a parsed geometry graph over IPC.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A path, size or SHA mismatch rejects; no earlier publication substitutes for a failed one.
 * @evidence contracts/common.md#meaningful-documentation Documents owned-path admission and exact byte/hash verification.
 * @evidence contracts/performance.md#efficient-algorithms One stat, bounded asynchronous read and SHA pass cost O(B); declared and actual sizes precede allocation, and file growth can consume only one extra probe byte.
 * @evidence contracts/performance.md#reuse-equivalent-work Each read verifies current bytes; the session owns reuse of a successfully verified publication.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The opened file closes on success and failure; at most the admitted byte count and one probe byte are read. The returned Buffer belongs to the ordinary session and its file to the process owner. Mannequin uses its separate path.
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
    Number(record.bytes) > HumanImagePublication.MAX_BYTES ||
    record.encoding !== HumanImagePublication.ENCODING ||
    record.canonical !== HumanImagePublication.CANONICAL ||
    typeof record.sha256 !== "string" ||
    !/^[a-f0-9]{64}$/.test(record.sha256)
  )
    throw new Error("Invalid worker publication identity");
  const file: fs.FileHandle = await fs.open(filename, "r");
  try {
    const stat: Awaited<ReturnType<fs.FileHandle["stat"]>> = await file.stat();
    if (!stat.isFile() || stat.size !== record.bytes)
      throw new Error("Worker publication bytes changed");
    const bytes: Buffer<ArrayBuffer> = Buffer.alloc(stat.size);
    let offset: number = 0;
    while (offset < bytes.length) {
      const read: Awaited<ReturnType<fs.FileHandle["read"]>> = await file.read(bytes, offset, bytes.length - offset, offset);
      if (read.bytesRead === 0) throw new Error("Worker publication bytes changed");
      offset += read.bytesRead;
    }
    const probe: Buffer = Buffer.alloc(1);
    if ((await file.read(probe, 0, 1, bytes.length)).bytesRead !== 0)
      throw new Error("Worker publication bytes changed");
    const sha: string = Buffer.from(await webcrypto.subtle.digest("SHA-256", bytes)).toString("hex");
    if (sha !== record.sha256) throw new Error("Worker publication bytes changed");
    return bytes;
  } finally {
    await file.close();
  }
}
