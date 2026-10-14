import { IAutoMoviePropBox } from "@automovie/interface";

/**
 * Whether one axis of a declared prop volume is a real extent: both bounds
 * finite and the minimum strictly below the maximum.
 *
 * A flat or inverted axis encloses no volume, so a footprint or clearance box
 * failing it can be neither contained, borne nor overlapped. The prop
 * placement gate reports a failing axis by its path and measures only props
 * whose every declared box passes, so the report and the measurement read one
 * rule.
 *
 * @param box A declared footprint or clearance box, in metres.
 * @param axis The axis to judge.
 * @returns `true` only for finite bounds with `min < max` on that axis.
 *
 * @evidence contracts/common.md#principled-implementation `Number.isFinite` on both bounds and a strict `<`, so `NaN`, either infinity, a zero-thickness and an inverted axis all fail, which are exactly the extents no containment or overlap test can use.
 * @evidence contracts/common.md#clear-and-simple-design One per-axis predicate shared by `validatePropPlacements`, which reports each failing axis, and `validatePropPlacementGeometry`, which measures only sound boxes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No tolerance widens a flat axis into a volume and no axis is special-cased; a failing box is reported as authored.
 * @evidence contracts/common.md#meaningful-documentation States the rule, why a failing axis cannot be measured, both callers, and the unit of the box.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Two finiteness tests and one comparison, with no algorithm to choose.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure predicate on one axis that coordinates no work across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Reads two bounds of the caller's box and allocates or retains nothing.
 */
export const propBoxAxisIsSound = (
  box: IAutoMoviePropBox,
  axis: "x" | "y" | "z",
): boolean =>
  Number.isFinite(box.min[axis]) &&
  Number.isFinite(box.max[axis]) &&
  box.min[axis] < box.max[axis];
