import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `armAtSide` row of `HumanUpperRows` fixes on `armPhrase`,
 * spread into its parameters. An arm at rest at the side: the relaxed hand
 * visits a place beside the thigh, palm in, and stays.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the values the preset fixes, the law it is spread into and the row that reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own parameters as one `IArmPhrasePhraseTargetMirrorOffsetShapeFacingHoldPreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanGesture.PHRASE_ARM_AT_SIDE`; the `armAtSide` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_GESTURE_PHRASE_ARM_AT_SIDE: IAutoMovieMotionHumanGesture.IArmPhrasePhraseTargetMirrorOffsetShapeFacingHoldPreset =
  {
    phrase: "visit",
    target: { kind: "self", region: "hipRight" },
    mirror: true,
    offset: { out: 0.12, up: -0.1, forward: 0 },
    shape: "relaxed",
    facing: { fingers: "down", palm: "in" },
    hold: "long",
  };
