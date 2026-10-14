import { SHA256_DIGEST_PATTERN } from "@automovie/engine";

/**
 * Check a claimed digest using the engine's canonical SHA-256 syntax.
 *
 * @evidence contracts/common.md#principled-implementation The shared pattern settles spelling only; actual byte hashing/provenance stays with the caller.
 * @evidence contracts/common.md#clear-and-simple-design One predicate supplies receipt byte-fact checks without another regex owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A canonical string cannot by itself certify any resident byte population.
 * @evidence contracts/common.md#meaningful-documentation Defines lexical digest admission rather than content comparison.
 * @evidence contracts/performance.md#efficient-algorithms Scans the digest string under the fixed SHA-256 profile, allocating no payload buffer.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the module-owned canonical pattern, with no stored per-value verdict.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The input remains borrowed and only a boolean escapes; no native resource is owned.
 */
export function productionRenderJobValidDigest(value: string): boolean {
    return SHA256_DIGEST_PATTERN.test(value);
}
