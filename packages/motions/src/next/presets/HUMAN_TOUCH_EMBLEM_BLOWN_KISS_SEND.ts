import type { IAutoMovieMotionHumanTouch } from "@automovie/interface";

/*
 * The values the `blownKissSend` row of `HumanEmblem` fixes on `touch`, spread
 * into its parameters. The blown kiss's send, performed after `blownKiss`: the
 * open hand, palm up, swept forward from the lips and held a moment at the
 * shoulder's height, 0.818 of the stature, the forearm and the hand's length,
 * 0.146 and 0.108 of it, ahead of the performer (Drillis and Contini's segment
 * proportions, as Winter's Biomechanics and Motor Control of Human Movement
 * tabulates them), in the performer's own statures so it fits every body.
 */
export const HUMAN_TOUCH_EMBLEM_BLOWN_KISS_SEND: IAutoMovieMotionHumanTouch.ITouchTargetEffectorKindHoldPreset =
  {
    target: {
      kind: "point",
      at: { x: 0, y: 0.818, z: 0.146 + 0.108 },
      frame: "stature",
      normal: { x: 0, y: -1, z: 0 },
    },
    effector: "palm",
    kind: "hold",
    hold: 0.3,
  };
