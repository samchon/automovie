import type { IAutoMovieAngleRange } from "./IAutoMovieAngleRange";

/**
 * The swing-and-twist limit of a ball joint.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the measure, its origin, its unit and its sign.
 * @evidence contracts/development/design.md#principled-representation An interval of the twist about the limb's own axis left after the shortest swing from rest, by the swing-twist decomposition whose only singularity lies at the rest direction's antipode, which the farthest reach keeps outside.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two members: the twist interval and the farthest reach; the swing's region is read from the constraint's own flexion and abduction intervals, not restated, and the record is additive and optional on the constraint.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a constraint without it keeps the three-angle gate unchanged.
 */
export interface IAutoMovieSwingTwistLimit {
  /** The limb's turn about its own long axis measured from the rig's rest pose by the swing-twist decomposition, degrees; positive external, negative internal. */
  twist: IAutoMovieAngleRange;

  /** The farthest the limb's long axis may point from its rest direction, degrees, below 180, so the rest direction's antipode, where the twist has no value, lies outside the range; the reach the flexion and abduction intervals give when absent. */
  reach?: number;
}
