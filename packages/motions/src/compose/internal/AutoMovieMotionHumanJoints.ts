import type {
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanChannel,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanJoints,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
} from "@automovie/interface";

import { AutoMovieMotionHumanChannel as HumanChannels } from "./AutoMovieMotionHumanChannel";

/*
 * Joint primitives: clinical angles written on the joints of a channel
 * directly, for the parts no effector goal places (the head's nod, the shoulder
 * girdle's shrug, the spine's slump).
 */
export namespace AutoMovieMotionHumanJoints {
  /*
   * The channels a set of angles is written on.
   * Parameter angles: Angles by bone.
   * Returns: The channels of its bones, in
   * AutoMovieMotionHumanChannel.ORDER.
   */
  export function channels(
    angles: IAutoMovieMotionHumanJoints.Angles,
  ): AutoMovieMotionHumanChannel[] {
    const found: Set<AutoMovieMotionHumanChannel> = new Set(
      (Object.keys(angles) as AutoMovieHumanoidBone[]).map(
        (bone: AutoMovieHumanoidBone): AutoMovieMotionHumanChannel =>
          HumanChannels(bone),
      ),
    );
    return HumanChannels.ORDER.filter(
      (c: AutoMovieMotionHumanChannel): boolean => found.has(c),
    );
  }

  /*
   * Angles added to the joints a posture holds.
   * Parameter props: The channels, the window and the angles.
   * Returns: The primitive.
   * At a second when an angle is given for a bone outside the
   * channels.
   */
  export function add(
    props: IAutoMovieMotionHumanJoints.IAdd,
  ): IAutoMovieMotionHumanPrimitive {
    const channels: IAutoMovieMotionHumanJoints.IAdd["channels"] =
      props.channels;
    return {
      channels,
      reads: channels,
      from: props.from,
      to: props.to,
      write: (
        posture: IAutoMovieMotionHumanPosture,
        seconds: number,
      ): IAutoMovieMotionHumanPosture => {
        const joints: IAutoMovieMotionHumanPosture["joints"] = {
          ...posture.joints,
        };
        for (const [bone, more] of Object.entries(props.delta(seconds)) as [
          AutoMovieHumanoidBone,
          readonly [number, number, number],
        ][]) {
          if (!HumanChannels.covers(props.channels, bone))
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

  /*
   * Angles added and taken back: their share rises over one window and falls
   * over another on the clock's envelope (a nod, a shrug, a flinch), and the
   * joints are written from the first instant to the last on the channels of
   * the angles' own bones.
   * Parameter clock: The action's clock.
   * Parameter rise: The instants the angles start growing and are full at.
   * Parameter fall: The instants the angles start shrinking and are gone at.
   * Parameter peak: The angles at their fullest.
   * Returns: The primitive.
   */
  export function pulse(
    clock: IAutoMovieMotionClock,
    rise: readonly [string, string],
    fall: readonly [string, string],
    peak: IAutoMovieMotionHumanJoints.Angles,
  ): IAutoMovieMotionHumanPrimitive {
    return add({
      channels: channels(peak),
      from: clock.at(rise[0]),
      to: clock.at(fall[1]),
      delta: (seconds: number): IAutoMovieMotionHumanJoints.Angles => {
        const share: number = clock.envelope(rise, fall, seconds);
        const out: IAutoMovieMotionHumanJoints.Angles = {};
        for (const [bone, full] of Object.entries(peak) as [
          AutoMovieHumanoidBone,
          readonly [number, number, number],
        ][])
          out[bone] = [full[0] * share, full[1] * share, full[2] * share];
        return out;
      },
    });
  }
}
