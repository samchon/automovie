import { TextDecoder } from "node:util";

/**
 * Removes complete HTML comments without changing any surrounding UTF-8 bytes.
 *
 * @evidence contracts/common.md#principled-implementation Fatal UTF-8 decoding validates bytes before delimiter-based removal of every complete HTML comment; retained subarrays are concatenated without decoding/re-encoding them, preserving exact surrounding bytes.
 * @evidence contracts/common.md#clear-and-simple-design The helper owns only byte-preserving comment removal; topology and evidence metadata policy remain with their callers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unclosed comments and invalid UTF-8 throw rather than being silently repaired; all HTML comments are removed regardless of evidence content.
 * @evidence contracts/common.md#meaningful-documentation The comment promises complete-comment removal and exact surrounding UTF-8 preservation; the thrown error names an unterminated working comment.
 * @evidence contracts/performance.md#efficient-algorithms Decoding, forward delimiter searches and final concatenation take linear work in byte count; temporary decoded text, slice descriptors and returned bytes require linear memory.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each buffer is processed independently because its bytes are the complete input and callers may mutate buffers; there is no coordinated request cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Subarray views retain input storage only until concatenation and return; the result owns its output bytes, and the function opens no handle or task.
 */
export function stripNaturalnessComments(bytes: Buffer): Buffer {
  new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  const chunks: Buffer[] = [];
  let offset: number = 0;
  while (true) {
    const opening: number = bytes.indexOf("<!--", offset);
    if (opening === -1) {
      chunks.push(bytes.subarray(offset));
      break;
    }
    const closing: number = bytes.indexOf("-->", opening + 4);
    if (closing === -1)
      throw new Error("Naturalness working file has an unclosed HTML comment.");
    chunks.push(bytes.subarray(offset, opening));
    offset = closing + 3;
  }
  return Buffer.concat(chunks);
}
