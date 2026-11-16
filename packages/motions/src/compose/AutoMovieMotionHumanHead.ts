import { AutoMovieMotionClock } from "./AutoMovieMotionClock";
import { AutoMovieMotionHumanJoints } from "./AutoMovieMotionHumanJoints";
import type { IAutoMovieMotionHumanPrimitive } from "./IAutoMovieMotionHumanPrimitive";

/**
 * Head phrases: the head moved on the neck by joint angles, with no target
 * to look at (a nod, a shake, a tilt to one side).
 *
 * Each angle is shared half by the neck and half by the head, the two joints
 * of the cervical chain the rig has. A head aimed at something is the gaze
 * primitive's.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the phrases move, how an angle is shared and which movement belongs to the gaze primitive instead.
 * @evidence contracts/development/design.md#principled-representation A head movement with no target is a clinical angle of the cervical chain, so the phrases are joint deltas on the head's channel that add to where the posture holds the head.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One share, its constant and three phrases; the oscillation they share is private. No law reads them yet: the reactions state their head angles as their own curves, and the gestures rebuilt for #3286 are the consumers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The axis is an index into the clinical triple the joints are written in, not a second name for it; aiming at a target is left to the gaze primitive instead of an optional target here.
 */
export namespace AutoMovieMotionHumanHead {
  /** The neck's share of a head angle; the head joint takes the rest. */
  export const NECK: number = 0.5;

  /**
   * A head angle shared between the neck and the head.
   *
   * @param axis Which of the clinical `[flexion, abduction, twist]`.
   * @param degrees The whole angle, degrees.
   * @returns The two joints' angles.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the axis, the unit and what is returned.
   * @evidence contracts/development/implementation.md#principled-implementation The rig has two cervical joints, so a head angle is split between them in the stated share and the two parts sum to the whole.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two fresh zero triples receive the same selected-axis products directly, without a per-sample helper closure.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The share is the named constant `NECK`; an even split is a modelling choice for a rig that lumps seven vertebrae into two joints, stated as such in the namespace comment.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Every head phrase splits its angle here.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function share(
    axis: 0 | 1 | 2,
    degrees: number,
  ): AutoMovieMotionHumanJoints.Angles {
    const neck: [number, number, number] = [0, 0, 0];
    neck[axis] = NECK * degrees;
    const head: [number, number, number] = [0, 0, 0];
    head[axis] = (1 - NECK) * degrees;
    return { neck, head };
  }

  /** An oscillation of one head angle over a window. */
  function oscillate(
    axis: 0 | 1 | 2,
    clock: AutoMovieMotionClock.IClock,
    window: readonly [string, string],
    cycles: number,
    degrees: number,
  ): IAutoMovieMotionHumanPrimitive {
    const from: number = clock.at(window[0]);
    const to: number = clock.at(window[1]);
    let wave: ReturnType<typeof AutoMovieMotionClock.prepareWave> | undefined;
    return AutoMovieMotionHumanJoints.add({
      channels: ["head"],
      from,
      to,
      delta: (seconds: number): AutoMovieMotionHumanJoints.Angles => {
        if (wave === undefined) wave = AutoMovieMotionClock.prepareWave(clock, window, cycles);
        return share(axis, degrees * wave(seconds));
      },
    });
  }

  /**
   * A nod: the head flexes and extends about where the posture holds it.
   *
   * @param clock The action's clock.
   * @param window The instants the nodding starts and ends at.
   * @param cycles How many nods; a positive integer.
   * @param degrees The flexion at its fullest, degrees.
   * @returns The primitive, on the head.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the movement, the window, the count and the unit.
   * @evidence contracts/development/implementation.md#principled-implementation A nod is a repeated flexion about the held pose, so the angle is the amplitude times `AutoMovieMotionClock.wave`, which leaves and rejoins the pose at rest.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call to the shared oscillation with the flexion axis.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None: the amplitude and the count are the caller's.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the oscillation with shake; its first actual sample admits the fixed count and prepares the same Clock wave constants, while every sample still calls the current clock.linear implementation.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work per evaluated second.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitive retains its arguments and at most one fixed wave reader until released, without retaining samples or postures.
   */
  export function nod(
    clock: AutoMovieMotionClock.IClock,
    window: readonly [string, string],
    cycles: number,
    degrees: number,
  ): IAutoMovieMotionHumanPrimitive {
    return oscillate(0, clock, window, cycles, degrees);
  }

  /**
   * A shake: the head turns left and right about where the posture holds it.
   *
   * @param clock The action's clock.
   * @param window The instants the shaking starts and ends at.
   * @param cycles How many shakes; a positive integer.
   * @param degrees The twist at its fullest, degrees.
   * @returns The primitive, on the head.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the movement, the window, the count and the unit.
   * @evidence contracts/development/implementation.md#principled-implementation A shake is a repeated twist about the held pose, so the angle is the amplitude times `AutoMovieMotionClock.wave`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call to the shared oscillation with the twist axis.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None: the amplitude and the count are the caller's.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares nod's first-sample fixed-count preparation through the Clock owner; actual custom clock.linear callbacks and current sample evaluation remain.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work per evaluated second.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitive retains its fixed arguments and one lazy wave reader, without per-second samples or posture results.
   */
  export function shake(
    clock: AutoMovieMotionClock.IClock,
    window: readonly [string, string],
    cycles: number,
    degrees: number,
  ): IAutoMovieMotionHumanPrimitive {
    return oscillate(2, clock, window, cycles, degrees);
  }

  /**
   * A tilt: the head leans to one side and comes back.
   *
   * @param clock The action's clock.
   * @param rise The instants the tilt starts growing and is full at.
   * @param fall The instants the tilt starts shrinking and is gone at.
   * @param degrees The lateral flexion at its fullest, degrees.
   * @returns The primitive, on the head.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the movement, the two windows and the unit.
   * @evidence contracts/development/implementation.md#principled-implementation A tilt that grows, stays and goes is the lateral angle scaled by the clock's envelope over the two windows.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None: the amplitude and its side are the caller's signed angle.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `AutoMovieMotionHumanJoints.pulse` and `share`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work per evaluated second.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitive closes over its arguments only.
   */
  export function tilt(
    clock: AutoMovieMotionClock.IClock,
    rise: readonly [string, string],
    fall: readonly [string, string],
    degrees: number,
  ): IAutoMovieMotionHumanPrimitive {
    return AutoMovieMotionHumanJoints.pulse(
      clock,
      rise,
      fall,
      share(1, degrees),
    );
  }
}
