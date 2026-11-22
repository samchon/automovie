import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `beckonHand` row of `HumanUpperRows` fixes on `armPhrase`, spread into its parameters. A beckon: the open hand held out ahead, palm up, draws in toward the chest and out again.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the values the preset fixes, the law it is spread into and the row that reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own parameters as one `IArmPhrasePhraseTargetMirrorOffsetSwingCountFacingPreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanGesture.PHRASE_BECKON_HAND`; the `beckonHand` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_GESTURE_PHRASE_BECKON_HAND: IAutoMovieMotionHumanGesture.IArmPhrasePhraseTargetMirrorOffsetSwingCountFacingPreset =
  {
    phrase: "oscillate",
    target: { kind: "self", region: "shoulderRight" },
    mirror: true,
    offset: { out: 0, up: -0.2, forward: 0.5 },
    swing: { out: 0, up: 0, forward: 0.08 },
    count: 3,
    facing: { fingers: "forward", palm: "up" },
  };
