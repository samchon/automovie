import type { IAutoMovieMotionHumanTouch } from "@automovie/interface";

/**
 * The values the `danceHold` row of `HumanPartner` fixes on `touch`, spread into its parameters. The follower's hold of a walking partner dance once both stand: her left palm laid on the leader and held 1.5 s. The composition gives the leader's region (his near shoulder at her left in a promenade). A hold kept while walking is coupled travel (#3341), not staged here: a speed-matching follower lags while the leader walks.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the values the preset fixes, the law it is spread into and the row that reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own parameters as one `ITouchEffectorKindHoldHandPreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanTouch.PARTNER_DANCE_HOLD`; the `danceHold` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_TOUCH_PARTNER_DANCE_HOLD: IAutoMovieMotionHumanTouch.ITouchEffectorKindHoldHandPreset =
  {
    effector: "palm",
    kind: "hold",
    hold: 1.5,
    hand: "left",
  };
