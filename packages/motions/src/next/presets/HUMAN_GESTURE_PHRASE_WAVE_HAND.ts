import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `waveHand` row of `HumanUpperRows` fixes on `armPhrase`,
 * spread into its parameters. A wave: the open hand oscillates out and in,
 * raised beside the head, palm forward.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the values the preset fixes, the law it is spread into and the row that reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own parameters as one `IArmPhrasePhraseTargetMirrorOffsetSwingCountFacingPreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanGesture.PHRASE_WAVE_HAND`; the `waveHand` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_GESTURE_PHRASE_WAVE_HAND: IAutoMovieMotionHumanGesture.IArmPhrasePhraseTargetMirrorOffsetSwingCountFacingPreset =
  {
    phrase: "oscillate",
    target: { kind: "self", region: "shoulderRight" },
    mirror: true,
    offset: { out: 0.25, up: 0.55, forward: 0.15 },
    swing: { out: 0.1, up: 0, forward: 0 },
    count: 3,
    facing: { fingers: "up", palm: "forward" },
  };
