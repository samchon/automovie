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
   */
  export function share(
    axis: 0 | 1 | 2,
    degrees: number,
  ): AutoMovieMotionHumanJoints.Angles {
    const of = (part: number): [number, number, number] => {
      const out: [number, number, number] = [0, 0, 0];
      out[axis] = part * degrees;
      return out;
    };
    return { neck: of(NECK), head: of(1 - NECK) };
  }

  /** An oscillation of one head angle over a window. */
  const oscillate = (
    axis: 0 | 1 | 2,
    clock: AutoMovieMotionClock.IClock,
    window: readonly [string, string],
    cycles: number,
    degrees: number,
  ): IAutoMovieMotionHumanPrimitive =>
    AutoMovieMotionHumanJoints.add({
      channels: ["head"],
      from: clock.at(window[0]),
      to: clock.at(window[1]),
      delta: (seconds: number): AutoMovieMotionHumanJoints.Angles =>
        share(
          axis,
          degrees * AutoMovieMotionClock.wave(clock, window, cycles, seconds),
        ),
    });

  /**
   * A nod: the head flexes and extends about where the posture holds it.
   *
   * @param clock The action's clock.
   * @param window The instants the nodding starts and ends at.
   * @param cycles How many nods; a positive integer.
   * @param degrees The flexion at its fullest, degrees.
   * @returns The primitive, on the head.
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
