import type { IAutoMovieMotionHumanTouch } from "@automovie/interface";

/*
 * The values the `shoulderPat` row of `HumanSocial` fixes on `touch`, spread
 * into its parameters. A pat on the partner's shoulder; the composition gives
 * the shoulder as the target. Two pats of 0.4 s, then 0.4 s, 1.2 s after the
 * reach (`AutoMovieMotionHumanTouchForm.FORMS`, provisional); encouragement,
 * praise.
 */
export const HUMAN_TOUCH_SOCIAL_SHOULDER_PAT: IAutoMovieMotionHumanTouch.ITouchEffectorKindCountPreset =
  {
    effector: "palm",
    kind: "pat",
    count: 2,
  };
