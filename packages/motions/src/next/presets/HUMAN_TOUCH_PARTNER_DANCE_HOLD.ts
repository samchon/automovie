import type { IAutoMovieMotionHumanTouch } from "@automovie/interface";

/*
 * The values the `danceHold` row of `HumanPartner` fixes on `touch`, spread
 * into its parameters. The follower's hold of a walking partner dance once both
 * stand: her left palm laid on the leader and held 1.5 s. The composition gives
 * the leader's region (his near shoulder at her left in a promenade). A hold
 * kept while walking is coupled travel, not staged here: a speed-matching
 * follower lags while the leader walks.
 */
export const HUMAN_TOUCH_PARTNER_DANCE_HOLD: IAutoMovieMotionHumanTouch.ITouchEffectorKindHoldHandPreset =
  {
    effector: "palm",
    kind: "hold",
    hold: 1.5,
    hand: "left",
  };
