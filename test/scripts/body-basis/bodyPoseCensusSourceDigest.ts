import crypto from "node:crypto";

/**
 * Fingerprint a caller-collected source snapshot independently of read order.
 * The census command supplies repository-relative paths normalized to forward
 * slashes and each file's exact bytes, plus named runtime/configuration inputs.
 * Distinct paths are required. Sorted path/base64 pairs have an unambiguous JSON
 * encoding, so changing a path, contents or runtime value changes the payload
 * hashed by SHA-256. Line endings and every byte participate; this is exact
 * content identity, not an assertion of semantic equivalence. Inputs are owned
 * by the caller and are never reordered or mutated here.
 *
 * @evidence contracts/common.md#principled-implementation Sorting distinct canonical paths makes collection order irrelevant; JSON path/base64 pairs preserve entry and content boundaries before the standard SHA-256 operation.
 * @evidence contracts/common.md#clear-and-simple-design One duplicate check, owned sort/encoding and digest operation own the fingerprint.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every supplied byte and path participates without a file-specific exemption.
 * @evidence contracts/common.md#meaningful-documentation States the caller's collection/normalization duties, encoding, byte identity and no-mutation rule.
 */
export function bodyPoseCensusSourceDigest(
  files: readonly { path: string; bytes: Uint8Array }[],
): string {
  if (new Set(files.map((file) => file.path)).size !== files.length)
    throw new Error("A census source snapshot needs distinct file paths.");
  const payload = [...files]
    .sort((a, b) => (a.path < b.path ? -1 : 1))
    .map((file) => [file.path, Buffer.from(file.bytes).toString("base64")]);
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
}
