import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";
import type { AutoMovieMotionHumanChannel } from "./AutoMovieMotionHumanChannel";

/**
 * Joint primitives: clinical angles written on the joints of a channel
 * directly, for the parts no effector goal places (the head's nod, the shoulder
 * girdle's shrug, the spine's slump).
 */
export namespace IAutoMovieMotionHumanJoints {
  /** Clinical `[flexion, abduction, twist]` degrees by bone. */
  export type Angles = Partial<
    Record<AutoMovieHumanoidBone, readonly [number, number, number]>
  >;

  /** Angles added over a window. */
  export interface IAdd {
    /** The channels whose joints are written. */
    channels: readonly AutoMovieMotionHumanChannel[];

    /** Seconds since the action's start from which the angles are added. */
    from: number;

    /** Seconds since the action's start until which the angles are added. */
    to: number;

    /**
     * The angles added to what the posture holds.
     *
     * @param seconds Seconds since the action's start.
     * @returns Degrees by bone; every bone belongs to one of the channels.
     */
    delta(seconds: number): IAutoMovieMotionHumanJoints.Angles;
  }
}
