import { Quaternion } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import { HumanHandover } from "./HumanHandover";

/**
 * The turn about the world's up an upright carry takes along a path
 * (`HumanHandover.upright`): the turn chosen at instants no more than
 * `HumanHandover.STEP` apart by the tip each posture leaves, the request each
 * instant's yaw is fitted on, and the tip measure itself.
 */
export namespace HumanHandoverUpright {
  /**
   * One instant of a carry: the posture with every goal but the acting hand's
   * rotation, and that rotation at a yaw.
   */
  export interface IFrame {
    /** The posture at the instant, every goal but the acting hand's. */
    posture: IAutoMovieMotionHumanPosture;

    /** The acting hand's goal without its rotation. */
    goal: Omit<IAutoMovieHumanLimbGoal, "rotation">;

    /** The acting hand's world rotation at a turn about the world's up. */
    rotation: (yaw: number) => IAutoMovieQuaternion;
  }

  /**
   * The turn of an upright carry along a path, as `HumanHandover.upright`
   * documents it.
   *
   * @param body The body.
   * @param side The hand.
   * @param at The posture at a second with the hand turned by a yaw, degrees.
   * @param from The path's first second.
   * @param to The path's last second.
   * @param ends The turns at the two ends, degrees; a missing last end is
   *   chosen as the instants between are.
   * @returns The turn at a second, degrees.
   */
  export function ordinary(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    at: (seconds: number, yaw: number) => IAutoMovieMotionHumanPosture,
    from: number,
    to: number,
    ends: readonly [number, number | undefined],
  ): (seconds: number) => number {
    return chosen(
      (seconds: number): ((yaw: number) => number) =>
        (yaw: number): number =>
          HumanHandover.tipped(body, side, at(seconds, yaw)),
      from,
      to,
      ends,
    );
  }

  /**
   * The posture of an instant at a yaw: the acting arm's goal with its rotation
   * there, every other goal as the frame holds it.
   *
   * @param frame The instant.
   * @param side The acting hand.
   * @param yaw Degrees about world up.
   * @returns The posture.
   */
  export function posed(
    frame: IFrame,
    side: AutoMovieHumanSide,
    yaw: number,
  ): IAutoMovieMotionHumanPosture {
    return {
      ...frame.posture,
      limbs: { ...frame.posture.limbs, [`${side}Arm`]: goalOf(frame, yaw) },
    };
  }

  /**
   * How far a reached hand rotation tips what an asked upright rotation holds:
   * the angle the reached rotation's error from the asked one turns the world's
   * up through.
   *
   * @param asked The asked world hand rotation; absent when the goal asks none.
   * @param reached The reached world hand rotation.
   * @returns Degrees; infinite when either is absent.
   */
  export function angle(
    asked: IAutoMovieQuaternion | undefined,
    reached: IAutoMovieQuaternion | undefined,
  ): number {
    if (asked === undefined || reached === undefined) return Infinity;
    const off: IAutoMovieQuaternion = Quaternion.multiply(
      Quaternion.normalize(reached),
      Quaternion.inverse(Quaternion.normalize(asked)),
    );
    return (
      (Math.acos(
        Math.max(
          -1,
          Math.min(1, Quaternion.rotateVector(off, { x: 0, y: 1, z: 0 }).y),
        ),
      ) *
        180) /
      Math.PI
    );
  }
}

/** The acting arm's goal with its rotation at a yaw. */
function goalOf(
  frame: HumanHandoverUpright.IFrame,
  yaw: number,
): IAutoMovieHumanLimbGoal {
  const { point, ...rest }: typeof frame.goal = frame.goal;
  return { point, rotation: frame.rotation(yaw), ...rest };
}

/**
 * Degrees of tip a turn costs per degree it changes from the instant before
 * (provisional: a tenth, so a change of one 15-degree step is worth 1.5 degrees
 * of tip, holding the turn steady where the tips are close).
 */
const HOLD: number = 0.1;

/**
 * Cost differences below this are ties, kept by the earlier, nearer turn:
 * degrees, far below a fit's resolution.
 */
const TIE: number = 1e-9;

/**
 * The turn at each instant no more than `STEP` apart, least tip plus `HOLD` per
 * degree of change first, interpolated between.
 */
function chosen(
  rankAt: (seconds: number) => (yaw: number) => number,
  from: number,
  to: number,
  ends: readonly [number, number | undefined],
): (seconds: number) => number {
  // The fewest instants that keep every interval within STEP; the 1e-9
  // keeps a path an exact multiple of STEP from gaining an instant to
  // floating-point rounding of the quotient.
  const count: number = Math.max(
    1,
    Math.ceil((to - from) / HumanHandover.STEP - 1e-9),
  );
  const times: number[] = [from];
  const turns: number[] = [ends[0]];
  for (let k: number = 1; k <= count; k++) {
    const seconds: number = from + ((to - from) * k) / count;
    times.push(seconds);
    if (k === count && ends[1] !== undefined) {
      turns.push(ends[1]);
      continue;
    }
    const rank: (yaw: number) => number = rankAt(seconds);
    const before: number = turns.at(-1)!;
    let best: number = before;
    let least: number = Infinity;
    for (const yaw of HumanHandover.YAWS) {
      const cost: number = rank(yaw) + HOLD * Math.abs(yaw - before);
      if (cost < least - TIE) {
        least = cost;
        best = yaw;
      }
    }
    turns.push(best);
  }
  return interpolate(from, times, turns);
}

/**
 * The turn at a second: the first end's before the path, the last instant's
 * after it, linear between instants.
 */
function interpolate(
  from: number,
  times: readonly number[],
  turns: readonly number[],
): (seconds: number) => number {
  return (seconds: number): number => {
    if (!(seconds > from)) return turns[0]!;
    let low: number = 1;
    let high: number = times.length;
    while (low < high) {
      const middle: number = Math.floor((low + high) / 2);
      if (seconds <= times[middle]!) high = middle;
      else low = middle + 1;
    }
    if (low === times.length) return turns.at(-1)!;
    return (
      turns[low - 1]! +
      ((turns[low]! - turns[low - 1]!) * (seconds - times[low - 1]!)) /
        (times[low]! - times[low - 1]!)
    );
  };
}
