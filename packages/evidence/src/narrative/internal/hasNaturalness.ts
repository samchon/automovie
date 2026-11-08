import type { AuthoredLayer } from "../AuthoredLayer";

/**
 * Only final screenplay has an independent expression pass. Scripts construction
 * also answers expression questions so content-shaped defects remain repairable.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Literal membership limits separate expression revision to screenplay; scripts expression remains in construction.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The shared type guard keeps the same eligibility rule in claim factories and dependency validation.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The admitted layer is the actual separate expression pass, not a consumer-specific exception.
 * @evidence contracts/development/common.md#meaningful-documentation The comment identifies the separate expression layer and scripts construction responsibility; the return type narrows callers to the naturalness stage key.
 * @evidence contracts/development/implementation.md#efficient-algorithms One literal comparison takes constant time and no collection allocation.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This pure membership predicate coordinates no reusable requests or effectful work.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function owns no retained state, descriptor or task.
 */
export function hasNaturalness(layer: AuthoredLayer): layer is "screenplay" {
  return layer === "screenplay";
}
