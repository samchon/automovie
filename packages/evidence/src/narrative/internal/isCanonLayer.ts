import type { AuthoredLayer } from "../AuthoredLayer";

/**
 * Reports whether a layer is canon, long-route settings or short-route brief, which inherits no parent layer.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Settings and brief are the two source layers: neither inherits a unit, answers narrative duties or carries an upstream relation, so one predicate marks both.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Claim and reference factories share this guard instead of repeating the canon literals.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The predicate names the declared canon layers of the long and short routes; no consumer identity changes it.
 * @evidence contracts/development/common.md#meaningful-documentation The comment names both canon layers and what makes them canon; the return type narrows callers to those literals.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two literal comparisons take constant time and allocate nothing.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This pure predicate coordinates no reusable requests or effectful work.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function owns no retained state, descriptor or task.
 */
export function isCanonLayer(
  layer: AuthoredLayer,
): layer is "settings" | "brief" {
  return layer === "settings" || layer === "brief";
}
