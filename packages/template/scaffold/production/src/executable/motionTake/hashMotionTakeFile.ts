import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";

/**
 * Compute one SHA-256 over the bytes of an authored source or dependency file.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the digest algorithm and input bytes.
 * @evidence contracts/development/implementation.md#principled-implementation Updates the digest with the chunks of a binary file stream in order. No decoding, normalization or stat-based surrogate substitutes for the actual bytes.
 * @evidence contracts/development/implementation.md#efficient-algorithms Reads one stream into one digest. One linear streamed read. Future calls must detect changed file content. Async iteration closes the stream and retains no file contents.
 */
export async function hashMotionTakeFile(file: string): Promise<string> {
  const hash: ReturnType<typeof createHash> = createHash("sha256");
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest("hex");
}
