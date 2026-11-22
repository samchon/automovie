import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `headScratch` row of `HumanUpperRows` fixes on `armPhrase`, spread into its parameters. Scratching the head: the forefinger's tip oscillates on the crown.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the values the preset fixes, the law it is spread into and the row that reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own parameters as one `IArmPhrasePhraseTargetSurfaceShapeSwingCountPreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanGesture.PHRASE_HEAD_SCRATCH`; the `headScratch` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_GESTURE_PHRASE_HEAD_SCRATCH: IAutoMovieMotionHumanGesture.IArmPhrasePhraseTargetSurfaceShapeSwingCountPreset =
  {
    phrase: "oscillate",
    target: { kind: "self", region: "crown" },
    surface: "indexTip",
    shape: "relaxed",
    swing: { out: 0, up: 0, forward: 0.03 },
    count: 4,
  };
