import type { ReferenceManifest } from "./ReferenceManifest.ts";
import { readBytes } from "./readBytes.ts";

/**
 * Parses one declared private JSON input from its verified bytes.
 * The generic return type is the producer's schema responsibility, not runtime geometric admission.
 *
 * @evidence contracts/common.md#principled-implementation Parses exactly the buffer that readBytes verified against the manifest, preventing a second live read between identity checking and interpretation.
 * @evidence contracts/common.md#clear-and-simple-design Adds JSON syntax interpretation to one owned byte-admission operation; producer-specific semantics remain outside this helper.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source path, default payload or expected geometry is substituted; malformed JSON and stale input failures propagate.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes complete-byte admission from the unchecked generic semantic shape expected by the caller.
 * @evidence contracts/performance.md#efficient-algorithms Reads and parses one complete JSON document, with time and peak memory scaling with its encoded and parsed size.
 * @evidence contracts/performance.md#reuse-equivalent-work No parsed cache is retained; each call verifies the exact bytes it consumes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Byte handles close inside readBytes; parsed object ownership transfers to the caller and this module retains nothing.
 */
export function readInput<T>(manifest: ReferenceManifest, id: string): T {
  return JSON.parse(readBytes(manifest, id).toString("utf8")) as T;
}
