import type { AuthoredLayer } from "../AuthoredLayer";

/**
 * Only rendered dialogue and screenplay have an independent expression pass.
 *
 * @evidence contracts/common.md#principled-implementation Literal membership limits expression revision to scripts and screenplay; documentary layers remain construction-only.
 * @evidence contracts/common.md#clear-and-simple-design The shared type guard keeps the same eligibility rule in claim factories and dependency validation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The admitted layers are the domain's two actual expression passes, not special names chosen for a consumer.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies eligible rendered text layers; the return type narrows callers to their naturalness stage keys.
 * @evidence contracts/performance.md#efficient-algorithms Two literal comparisons take constant time and no collection allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This pure membership predicate coordinates no reusable requests or effectful work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The function owns no retained state, descriptor or task.
 */
export function hasNaturalness(
  layer: AuthoredLayer,
): layer is "scripts" | "screenplay" {
  return layer === "scripts" || layer === "screenplay";
}
