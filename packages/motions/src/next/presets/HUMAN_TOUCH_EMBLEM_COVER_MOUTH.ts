import type { IAutoMovieMotionHumanTouch } from "@automovie/interface";

/*
 * The values the `coverMouth` row of `HumanEmblem` fixes on `touch`, spread
 * into its parameters. A hand over the mouth, as at a gasp or a yawn.
 */
export const HUMAN_TOUCH_EMBLEM_COVER_MOUTH: IAutoMovieMotionHumanTouch.ITouchTargetEffectorKindHandPreset =
  {
    target: { kind: "self", region: "mouth" },
    effector: "palm",
    kind: "hold",
    hand: "right",
  };
