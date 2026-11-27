import type { IAutoMovieMotionHumanTouch } from "@automovie/interface";

/*
 * The values the `coverEars` row of `HumanEmblem` fixes on `touch`, spread into
 * its parameters. Both hands over the ears.
 */
export const HUMAN_TOUCH_EMBLEM_COVER_EARS: IAutoMovieMotionHumanTouch.ITouchTargetOtherEffectorKindHandPreset =
  {
    target: { kind: "self", region: "earRight" },
    other: { kind: "self", region: "earLeft" },
    effector: "palm",
    kind: "hold",
    hand: "right",
  };
