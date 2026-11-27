import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanJoints,
  IAutoMovieMotionHumanPrimitive,
} from "@automovie/interface";

import { motionClock } from "./motionClock";
import { AutoMovieMotionHumanJoints } from "./AutoMovieMotionHumanJoints";

/*
 * Head phrases: the head moved on the neck by joint angles, with no target to
 * look at (a nod, a shake, a tilt to one side).
 *
 * Each angle is shared half by the neck and half by the head, the two joints of
 * the cervical chain the rig has. A head aimed at something is the gaze
 * primitive's.
 */
export namespace AutoMovieMotionHumanHead {
  /*
   * The neck's share of a head angle; the head joint takes the rest.
   */
  export const NECK: number = 0.5;

  /*
   * A head angle shared between the neck and the head.
   * Parameter axis: Which of the clinical `[flexion, abduction, twist]`.
   * Parameter degrees: The whole angle, degrees.
   * Returns: The two joints' angles.
   */
  export function share(
    axis: ShareAxis,
    degrees: number,
  ): IAutoMovieMotionHumanJoints.Angles {
    const neck: [number, number, number] = [0, 0, 0];
    neck[axis] = NECK * degrees;
    const head: [number, number, number] = [0, 0, 0];
    head[axis] = (1 - NECK) * degrees;
    return { neck, head };
  }

  /*
   * A nod: the head flexes and extends about where the posture holds it.
   * Parameter clock: The action's clock.
   * Parameter window: The instants the nodding starts and ends at.
   * Parameter cycles: How many nods; a positive integer.
   * Parameter degrees: The flexion at its fullest, degrees.
   * Returns: The primitive, on the head.
   */
  export function nod(
    clock: IAutoMovieMotionClock,
    window: readonly [string, string],
    cycles: number,
    degrees: number,
  ): IAutoMovieMotionHumanPrimitive {
    return oscillate(0, clock, window, cycles, degrees);
  }

  /*
   * A shake: the head turns left and right about where the posture holds it.
   * Parameter clock: The action's clock.
   * Parameter window: The instants the shaking starts and ends at.
   * Parameter cycles: How many shakes; a positive integer.
   * Parameter degrees: The twist at its fullest, degrees.
   * Returns: The primitive, on the head.
   */
  export function shake(
    clock: IAutoMovieMotionClock,
    window: readonly [string, string],
    cycles: number,
    degrees: number,
  ): IAutoMovieMotionHumanPrimitive {
    return oscillate(2, clock, window, cycles, degrees);
  }

  /*
   * A tilt: the head leans to one side and comes back.
   * Parameter clock: The action's clock.
   * Parameter rise: The instants the tilt starts growing and is full at.
   * Parameter fall: The instants the tilt starts shrinking and is gone at.
   * Parameter degrees: The lateral flexion at its fullest, degrees.
   * Returns: The primitive, on the head.
   */
  export function tilt(
    clock: IAutoMovieMotionClock,
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

  /*
   * An oscillation of one head angle over a window.
   */
  function oscillate(
    axis: OscillateAxis,
    clock: IAutoMovieMotionClock,
    window: readonly [string, string],
    cycles: number,
    degrees: number,
  ): IAutoMovieMotionHumanPrimitive {
    const from: number = clock.at(window[0]);
    const to: number = clock.at(window[1]);
    const span: readonly [string, string] = [window[0], window[1]];

    const wave: ReturnType<typeof motionClock.prepareWave> =
      motionClock.prepareWave(clock, span, cycles);
    return AutoMovieMotionHumanJoints.add({
      channels: ["head"],
      from,
      to,
      delta: (seconds: number): IAutoMovieMotionHumanJoints.Angles => {
        return share(axis, degrees * wave(seconds));
      },
    });
  }
}

/*
 * The alternatives of `OscillateAxis`'s site.
 */
type OscillateAxis = 0 | 1 | 2;

/*
 * The alternatives of `ShareAxis`'s site.
 */
type ShareAxis = 0 | 1 | 2;
