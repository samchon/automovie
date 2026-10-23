import crypto from "node:crypto";

/**
 * Hashes raw UTF-8 or binary bytes without normalization.
 *
 * @evidence contracts/common.md#principled-implementation Node's SHA-256 hashes the supplied binary bytes or UTF-8 string directly and emits hexadecimal digest text, preserving byte-level identity without normalization.
 * @evidence contracts/common.md#clear-and-simple-design The small helper owns one hash operation; callers decide which files and runtime identities the digest covers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The documented cryptographic algorithm is used for every input; no expected digest, normalization or fallback substitutes for hashing actual bytes.
 * @evidence contracts/common.md#meaningful-documentation The comment states UTF-8/binary input and no normalization, while the implementation fixes SHA-256 and hex output.
 * @evidence contracts/performance.md#efficient-algorithms Hashing scans n bytes with constant-size digest state and fixed 64-character output; UTF-8 encoding cost follows input string length when a string is supplied.
 * @evidence contracts/performance.md#reuse-equivalent-work Each call creates an independent hash because the input is a complete value; callers may reuse a captured digest only within their own dependency-identity contract.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The native hash object is finalized by digest during the call and then released by runtime ownership; no file descriptor, task or module cache is retained.
 */
export function productionGateHash(bytes: string | Buffer): string {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}
