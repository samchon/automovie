import type { IAutoMovieMotionHumanTouch } from "@automovie/interface";

/**
 * The values the `coverMouth` row of `HumanEmblem` fixes on `touch`, spread into its parameters. A hand over the mouth, as at a gasp or a yawn.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the values the preset fixes, the law it is spread into and the row that reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own parameters as one `ITouchTargetEffectorKindHandPreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanTouch.EMBLEM_COVER_MOUTH`; the `coverMouth` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_TOUCH_EMBLEM_COVER_MOUTH: IAutoMovieMotionHumanTouch.ITouchTargetEffectorKindHandPreset =
  {
    target: { kind: "self", region: "mouth" },
    effector: "palm",
    kind: "hold",
    hand: "right",
  };
