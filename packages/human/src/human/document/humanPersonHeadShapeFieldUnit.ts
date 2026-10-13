import type { AutoMovieHumanPersonHeadShapeField } from "../structures/AutoMovieHumanPersonHeadShapeField";

/**
 * The public source-neutral difference unit of a closed head trait.
 *
 * Forehead and either pinna inclination use degrees; every other member of the admitted closed trait union uses millimetres. Publisher/resolver share this unit owner, while actual endpoint magnitudes/support remain source-defined. Runtime closed-field admission is the caller's responsibility; unknown untyped strings would take the default millimetre branch.
 *
 * @evidence contracts/common.md#principled-implementation Three named inclination traits select angular units and the remaining admitted exterior traits retain metric displacement units shared by publishing and resolution.
 * @evidence contracts/common.md#clear-and-simple-design This pure unit classifier contains no magnitude conversion, endpoint schema or anatomy implementation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source metadata cannot reinterpret public trait units; closed runtime identity admission remains explicit rather than claimed by this typed default branch.
 * @evidence contracts/common.md#meaningful-documentation Prose names angular exceptions, millimetre default and distinct source support/runtime-domain ownership.
 * @evidence contracts/performance.md#efficient-algorithms At most three fixed identity comparisons select one unit literal, independent of source geometry size.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Fixed scalar classification requires no result cache or shared request coordinator.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This scalar selector acquires no record, handle, geometry buffer or task.
 */
export function humanPersonHeadShapeFieldUnit(
  field: AutoMovieHumanPersonHeadShapeField,
): "mm" | "degree" {
  return field === "cranial.foreheadInclination" ||
    field === "ears.left.pinnaInclination" ||
    field === "ears.right.pinnaInclination"
    ? "degree"
    : "mm";
}
