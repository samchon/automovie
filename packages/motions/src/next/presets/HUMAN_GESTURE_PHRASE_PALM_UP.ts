import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `palmUp` row of `HumanUpperRows` fixes on `armPhrase`, spread into its parameters. Palms up: the open hand held out ahead at waist height, palm up.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the values the preset fixes, the law it is spread into and the row that reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own parameters as one `IArmPhrasePhraseTargetMirrorOffsetFacingHoldPreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanGesture.PHRASE_PALM_UP`; the `palmUp` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_GESTURE_PHRASE_PALM_UP: IAutoMovieMotionHumanGesture.IArmPhrasePhraseTargetMirrorOffsetFacingHoldPreset =
  {
    phrase: "visit",
    target: { kind: "self", region: "hipRight" },
    mirror: true,
    offset: { out: 0, up: 0.1, forward: 0.4 },
    facing: { fingers: "forward", palm: "up" },
    hold: "beat",
  };
