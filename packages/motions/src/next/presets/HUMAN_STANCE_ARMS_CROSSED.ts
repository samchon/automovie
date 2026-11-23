import type { IAutoMovieMotionHumanStance } from "@automovie/interface";

/**
 * The armsCrossed preset of `rest`: Arms crossed on the chest: each hand on the front of the other upper arm. Spread into `rest`'s parameters
 * with the hold; the `armsCrossed` row of `HumanStance` fixes these places. Where each place lies on the body and how
 * a hand reaches it is stated on `IAutoMovieMotionHumanRest`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two places the preset fixes, how it is applied, which row reads it and where the places' meanings are stated.
 * @evidence contracts/development/design.md#principled-representation The rest law's own `left` and `right` places as one `IRestPreset`, so the preset fits any body as `rest` does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanStance.ARMS_CROSSED`; the `armsCrossed` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_STANCE_ARMS_CROSSED: IAutoMovieMotionHumanStance.IRestPreset =
  {
    left: "crossed",
    right: "crossed",
  };
