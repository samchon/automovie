import { SHA256_DIGEST_PATTERN } from "@automovie/engine";

/**
 * Require the shared SHA-256 textual spelling for a declared identity.
 *
 * @evidence contracts/common.md#principled-implementation Checks runtime string type and SHA256_DIGEST_PATTERN, sharing the engine's canonical lowercase digest grammar.
 * @evidence contracts/common.md#clear-and-simple-design The owning shared pattern avoids a competing regular expression in derivation metadata validation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Spelling does not prove the digest matches current bytes, authenticated provenance or an impossible-collision property.
 * @evidence contracts/common.md#meaningful-documentation Documents role-specific malformed-digest refusal and unchanged accepted text.
 * @evidence contracts/performance.md#efficient-algorithms The fixed-format pattern scans bounded accepted digest text; rejected input length still belongs to its string/regex cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares the immutable grammar but caches no input-specific validity result.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The checker acquires no hash context or file; only a thrown diagnostic Error can retain label text.
 */
export function assertDigest(label: string, value: string): void {
  if (
    typeof value !== "string" ||
    SHA256_DIGEST_PATTERN.test(value) === false
  )
    throw new Error(`Design derivation ${label} digest is malformed.`);
}
