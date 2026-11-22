import type {
  IAutoMovieMotionHumanGaze,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
} from "@automovie/interface";

import { HumanGaze } from "../everyday/HumanGaze";

/**
 * The eyes and the head brought toward a target by a weight: the gaze
 * primitive, on the head channel only.
 *
 * The split between eyes and head and the exact solution of each eye belong
 * to {@link HumanGaze.aim}; this primitive gives it the target as a frame of
 * the action and a weight, and claims the head channel only. The trunk's
 * share of a far gaze is the trunk channel's to write, so a gaze here never
 * recruits it, and a target too far to the side stays visibly short.
 * Re-exported as `AutoMovieMotionHumanGaze.lookPrimitive`, apart from the
 * family's own `look` law.
 *
 * @param props The body, the target, the window and the weight.
 * @returns The primitive, on the head.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what moves, by what, and the channel claimed.
 * @evidence contracts/development/implementation.md#principled-implementation The gaze owner solves the eyes and the head for the target; the weight scales both shares alike where the head is recruited, the head's is 0 where the eyes are recruited alone so the neck and the head stay as the posture holds them, and the trunk's share is 0, since the trunk is another channel.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One clamp and one call.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The weight is clamped to [0, 1], so an overshooting time course cannot turn the head past the target.
 * @evidence contracts/development/implementation.md#efficient-algorithms One gaze solution per written second.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to HumanGaze.aim and lends the current composer operation's exact FK workspace; the arbitrary target callback and actual gaze remain evaluated in their original order.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitive closes over its live props only. A synchronous write may borrow its composer's exact FK workspace, which never enters a target, retained callback or returned posture.
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
