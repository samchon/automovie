import type { IAutoMovieMotionHumanStrike } from "@automovie/interface";

/**
 * The jab preset: a straight punch with the lead hand. Spread into `punch`'s
 * parameters beside the rest that the composition gives; each value means what
 * the law's member of the same name does. The `jab` row of `HumanStrike` fixes
 * these values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the preset fixes, how it is applied and which row reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own named member types as one `IPunchPreset`, so a preset fixes exactly its members and the law keeps every other default.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanStrike.JAB`; the jab row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_STRIKE_JAB: IAutoMovieMotionHumanStrike.IPunchPreset = {
  technique: "straight",
  hand: "lead",
};
