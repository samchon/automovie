import type { IAutoMovieMotionHumanTouch } from "@automovie/interface";

/**
 * The values the `handOnHeart` row of `HumanEmblem` fixes on `touch`, spread
 * into its parameters. A hand on the heart: the right palm on the left chest.
 */
export const HUMAN_TOUCH_EMBLEM_HAND_ON_HEART: IAutoMovieMotionHumanTouch.ITouchTargetEffectorKindHandPreset =
  {
    target: { kind: "self", region: "chestLeft" },
    effector: "palm",
    kind: "hold",
    hand: "right",
  };
