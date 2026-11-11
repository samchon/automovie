import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { IHumanPosture } from "../posture/IHumanPosture";
import { AutoMovieMotionHumanChannel } from "./AutoMovieMotionHumanChannel";
import type { IAutoMovieMotionHumanPrimitive } from "./IAutoMovieMotionHumanPrimitive";

/**
 * Joint primitives: clinical angles written on the joints of a channel
 * directly, for the parts no effector goal places (the head's nod, the
 * shoulder girdle's shrug, the spine's slump).
 */
export namespace AutoMovieMotionHumanJoints {
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
    delta(seconds: number): Angles;
  }

  /**
   * The channels a set of angles is written on.
   *
   * @param angles Angles by bone.
   * @returns The channels of its bones, in {@link AutoMovieMotionHumanChannel.ORDER}.
   */
  export function channels(angles: Angles): AutoMovieMotionHumanChannel[] {
    const found: Set<AutoMovieMotionHumanChannel> = new Set(
      (Object.keys(angles) as AutoMovieHumanoidBone[]).map(
        AutoMovieMotionHumanChannel.of,
      ),
    );
    return AutoMovieMotionHumanChannel.ORDER.filter(
      (c: AutoMovieMotionHumanChannel): boolean => found.has(c),
    );
  }

  /**
   * Angles added to the joints a posture holds.
   *
   * @param props The channels, the window and the angles.
   * @returns The primitive.
   * @throws {Error} At a second when an angle is given for a bone outside the channels.
   */
  export function add(props: IAdd): IAutoMovieMotionHumanPrimitive {
    return {
      channels: props.channels,
      from: props.from,
      to: props.to,
      write: (posture: IHumanPosture, seconds: number): IHumanPosture => {
        const joints: IHumanPosture["joints"] = { ...posture.joints };
        for (const [bone, more] of Object.entries(props.delta(seconds)) as [
          AutoMovieHumanoidBone,
          readonly [number, number, number],
        ][]) {
          if (!props.channels.includes(AutoMovieMotionHumanChannel.of(bone)))
            throw new Error(
              `A joint primitive writes ${bone} outside its channels`,
            );
          const was: readonly [number, number, number] = joints[bone] ?? [
            0, 0, 0,
          ];
          joints[bone] = [was[0] + more[0], was[1] + more[1], was[2] + more[2]];
        }
        return { ...posture, joints };
      },
    };
  }
}
