import type {
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanChannel,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanJoints,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
} from "@automovie/interface";

import { AutoMovieMotionHumanChannel as HumanChannels } from "./AutoMovieMotionHumanChannel";

/**
 * Joint primitives: clinical angles written on the joints of a channel
 * directly, for the parts no effector goal places (the head's nod, the
 * shoulder girdle's shrug, the spine's slump).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is written, in which angles, and for which parts.
 * @evidence contracts/development/design.md#principled-representation The parts with no end effector are posed by joint angles, added to what the posture holds so two sources of one joint's angle sum.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The channel lookup, one primitive (`add`) and one named time course (`pulse`).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Angles are keyed by the rig's bone union in the posture's own clinical triple.
 */
export namespace AutoMovieMotionHumanJoints {
  /**
   * The channels a set of angles is written on.
   *
   * @param angles Angles by bone.
   * @returns The channels of its bones, in {@link AutoMovieMotionHumanChannel.ORDER}.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input and the order of the result.
   * @evidence contracts/development/implementation.md#principled-implementation The set of each bone's owning channel, listed in the writing order so the result is the same for any key order.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One set and one filter.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Each channel appears once however many of its bones are named.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the bones, with set membership for the nine channels.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `AutoMovieMotionHumanChannel.of` and `ORDER`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function channels(
    angles: IAutoMovieMotionHumanJoints.Angles,
  ): AutoMovieMotionHumanChannel[] {
    const found: Set<AutoMovieMotionHumanChannel> = new Set(
      (Object.keys(angles) as AutoMovieHumanoidBone[]).map(HumanChannels.of),
    );
    return HumanChannels.ORDER.filter(
      (c: AutoMovieMotionHumanChannel): boolean => found.has(c),
    );
  }

  /**
   * Angles added to the joints a posture holds.
   *
   * @param props The channels, the window and the angles.
   * @returns The primitive.
   * @throws {Error} At a second when an angle is given for a bone outside the channels.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is added to what and when it throws.
   * @evidence contracts/development/implementation.md#principled-implementation Each angle triple is summed with the joint's held triple, or with zero when the posture holds none.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over the angles of the second.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A bone outside the claimed channels throws, since the merge would drop its angle without a sign.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the angles given.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `AutoMovieMotionHumanChannel.of`.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitive closes over its props only and holds no per-second state.
   */
  export function add(
    props: IAutoMovieMotionHumanJoints.IAdd,
  ): IAutoMovieMotionHumanPrimitive {
    return {
      channels: props.channels,
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

  /**
   * Angles added and taken back: their share rises over one window and falls
   * over another on the clock's envelope (a nod, a shrug, a flinch), and the
   * joints are written from the first instant to the last on the channels of
   * the angles' own bones.
   *
   * @param clock The action's clock.
   * @param rise The instants the angles start growing and are full at.
   * @param fall The instants the angles start shrinking and are gone at.
   * @param peak The angles at their fullest.
   * @returns The primitive.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two windows, the span written and the channels claimed.
   * @evidence contracts/development/implementation.md#principled-implementation Angles that come and go are the peak scaled by the clock's envelope, which leaves and rejoins the base without a jump.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call of `add` with the scaled peak.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The channels are derived from the peak's own bones, so they cannot disagree with it.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the peak's bones per written second.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `add`, `channels` and the clock.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitive closes over its arguments only.
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
