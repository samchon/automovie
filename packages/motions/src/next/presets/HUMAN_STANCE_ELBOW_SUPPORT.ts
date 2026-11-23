import type { IAutoMovieMotionHumanStance } from "@automovie/interface";

/**
 * The restElbowSupport preset of `rest`: Both hands at the elbow support.
 * Spread into `rest`'s parameters; the `restElbowSupport` row reads it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the values the preset fixes, how it is applied, which row reads it and what is provisional.
 * @evidence contracts/development/design.md#principled-representation The rest law's own members as one `IRestPreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanStance.ELBOW_SUPPORT`; the `restElbowSupport` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_STANCE_ELBOW_SUPPORT: IAutoMovieMotionHumanStance.IRestPreset =
  {
    left: "elbowSupport",
    right: "elbowSupport",
  };
