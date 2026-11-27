import type {
  IAutoMovieMotionHumanGaze,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
} from "@automovie/interface";

import { HumanGaze } from "../../everyday/internal/HumanGaze";

/*
 * The eyes and the head brought toward a target by a weight: the gaze
 * primitive, on the head channel only.
 *
 * The split between eyes and head and the exact solution of each eye belong to
 * HumanGaze.aim; this primitive gives it the target as a frame of the
 * action and a weight, and claims the head channel only. The trunk's share of a
 * far gaze is the trunk channel's to write, so a gaze here never recruits it,
 * and a target too far to the side stays visibly short. Re-exported as
 * `AutoMovieMotionHumanGaze.lookPrimitive`, apart from the family's own `look`
 * law.
 * Parameter props: The body, the target, the window and the weight.
 * Returns: The primitive, on the head.
 */
export function lookPrimitive(
  props: IAutoMovieMotionHumanGaze.ILook,
): IAutoMovieMotionHumanPrimitive {
  return {
    channels: ["head"],
    from: props.from,
    to: props.to,
    write: (
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
      _before?: IAutoMovieMotionHumanPrimitive.Reader,
      resolution?: Parameters<IAutoMovieMotionHumanPrimitive["write"]>[3],
    ): IAutoMovieMotionHumanPosture => {
      const w: number = Math.min(1, Math.max(0, props.weight(seconds)));

      // Eyes recruited alone leave the neck and the head where the
      // posture holds them: the head's weight is what moves them toward
      // the cervical split even at no share (`HumanGaze.aim`), and a
      // standing neck need not lie on that split's stack.
      return HumanGaze.aim(
        props.body,
        posture,
        props.target(posture, seconds),
        props.recruit,
        { eyes: w, head: props.recruit === "eyes" ? 0 : w, trunk: 0 },
        resolution,
      );
    },
  };
}
