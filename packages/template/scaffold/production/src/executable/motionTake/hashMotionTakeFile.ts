import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";

/**
 * Compute one SHA-256 over the bytes of an authored source or dependency file.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the digest algorithm and input bytes.
 * @evidence contracts/development/implementation.md#principled-implementation Updates the digest with the chunks of a binary file stream in order.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Reads one stream into one digest.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No decoding, normalization or stat-based surrogate substitutes for the actual bytes.
 * @evidence contracts/development/implementation.md#efficient-algorithms One linear streamed read.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Future calls must detect changed file content.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Async iteration closes the stream and retains no file contents.
 */
export async function hashMotionTakeFile(file: string): Promise<string> {
  const hash: ReturnType<typeof createHash> = createHash("sha256");
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest("hex");
}
