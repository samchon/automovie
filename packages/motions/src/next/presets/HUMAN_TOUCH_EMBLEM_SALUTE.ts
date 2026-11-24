import type { IAutoMovieMotionHumanTouch } from "@automovie/interface";

/**
 * The values the `salute` row of `HumanEmblem` fixes on `touch`, spread into
 * its parameters. The military hand salute (US Army TC 3-21.5): the
 * forefinger's end at the right brow, the hand in line with the forearm, the
 * upper arm level.
 */
export const HUMAN_TOUCH_EMBLEM_SALUTE: IAutoMovieMotionHumanTouch.ITouchTargetEffectorKindHandElbowPreset =
  {
    target: { kind: "self", region: "templeRight" },
    effector: "forefinger",
    kind: "hold",
    hand: "right",
    elbow: "level",
  };
