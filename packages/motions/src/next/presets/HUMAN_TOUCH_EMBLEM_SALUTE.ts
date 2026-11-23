import type { IAutoMovieMotionHumanTouch } from "@automovie/interface";

/**
 * The values the `salute` row of `HumanEmblem` fixes on `touch`, spread into
 * its parameters. The military hand salute (US Army TC 3-21.5): the
 * forefinger's end at the right brow, the hand in line with the forearm, the
 * upper arm level.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the values the preset fixes, the law it is spread into and the row that reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own parameters as one `ITouchTargetEffectorKindHandElbowPreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanTouch.EMBLEM_SALUTE`; the `salute` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_TOUCH_EMBLEM_SALUTE: IAutoMovieMotionHumanTouch.ITouchTargetEffectorKindHandElbowPreset =
  {
    target: { kind: "self", region: "templeRight" },
    effector: "forefinger",
    kind: "hold",
    hand: "right",
    elbow: "level",
  };
