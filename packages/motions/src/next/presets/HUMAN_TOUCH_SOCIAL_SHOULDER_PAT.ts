import type { IAutoMovieMotionHumanTouch } from "@automovie/interface";

/**
 * The values the `shoulderPat` row of `HumanSocial` fixes on `touch`, spread into its parameters. A pat on the partner's shoulder; the composition gives the shoulder as the target. Two pats of 0.4 s, then 0.4 s, 1.2 s after the reach (`AutoMovieMotionHumanTouchForm.FORMS`, provisional); encouragement, praise.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the values the preset fixes, the law it is spread into and the row that reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own parameters as one `ITouchEffectorKindCountPreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanTouch.SOCIAL_SHOULDER_PAT`; the `shoulderPat` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_TOUCH_SOCIAL_SHOULDER_PAT: IAutoMovieMotionHumanTouch.ITouchEffectorKindCountPreset =
  {
    effector: "palm",
    kind: "pat",
    count: 2,
  };
