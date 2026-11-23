import type { IAutoMovieMotionHumanStance } from "@automovie/interface";

/**
 * The paradeRest preset of `rest`: Parade rest: the hands clasped behind the
 * back, on the sacrum. Spread into `rest`'s parameters with the hold; the
 * `paradeRest` row of `HumanStance` fixes these places. Where each place lies
 * on the body and how a hand reaches it is stated on
 * `IAutoMovieMotionHumanRest`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two places the preset fixes, how it is applied, which row reads it and where the places' meanings are stated.
 * @evidence contracts/development/design.md#principled-representation The rest law's own `left` and `right` places as one `IRestPreset`, so the preset fits any body as `rest` does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanStance.PARADE_REST`; the `paradeRest` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_STANCE_PARADE_REST: IAutoMovieMotionHumanStance.IRestPreset =
  {
    left: "claspedBehind",
    right: "claspedBehind",
  };
