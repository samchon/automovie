import type { IAutoMovieMotionHumanTouch } from "@automovie/interface";

/**
 * The values the `coverEars` row of `HumanEmblem` fixes on `touch`, spread into
 * its parameters. Both hands over the ears.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the values the preset fixes, the law it is spread into and the row that reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own parameters as one `ITouchTargetOtherEffectorKindHandPreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanTouch.EMBLEM_COVER_EARS`; the `coverEars` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_TOUCH_EMBLEM_COVER_EARS: IAutoMovieMotionHumanTouch.ITouchTargetOtherEffectorKindHandPreset =
  {
    target: { kind: "self", region: "earRight" },
    other: { kind: "self", region: "earLeft" },
    effector: "palm",
    kind: "hold",
    hand: "right",
  };
