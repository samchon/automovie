import { IAutoMoviePropBox } from "@automovie/interface";

/**
 * Whether one axis of a declared prop volume is a real extent: both bounds
 * finite and the minimum strictly below the maximum.
 *
 * A flat or inverted axis encloses no volume, so a footprint or clearance box
 * failing it can be neither contained, borne nor overlapped. The prop placement
 * gate reports a failing axis by its path and measures only props whose every
 * declared box passes, so the report and the measurement read one rule.
 *
 * @param box A declared footprint or clearance box, in metres.
 * @param axis The axis to judge.
 * @returns `true` only for finite bounds with `min < max` on that axis.
 */
export const propBoxAxisIsSound = (
  box: IAutoMoviePropBox,
  axis: "x" | "y" | "z",
): boolean =>
  box.min[axis] < box.max[axis];
