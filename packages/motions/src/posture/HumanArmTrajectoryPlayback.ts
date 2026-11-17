import type {
  IAutoMovieMotionHumanArmClearance,
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import { HumanArmBranch } from "./HumanArmBranch";
import type { HumanArmClearance } from "./HumanArmClearance";
import { HumanArmGeometry as G } from "./HumanArmGeometry";
import { HumanArmRefine } from "./HumanArmRefine";

/**
 * One arm's reader of a trajectory's knots: the arm at any second, the
 * knots' cubic Hermite interpolant (`HumanArmRefine.hermite`) read back as
 * clinical triples. It owns only the playback's inputs, so a returned
 * reader keeps none of the problem, the contexts or the readings it was
 * solved with.
 *
 * The shoulder's triple is read on one reading along the whole trajectory
 * (`HumanArmBranch`): the first knot's is decoded alone, each later knot's
 * is the reading nearest the knot before it, and a second between two knots
 * is read nearest the knot it follows. Decoded alone, two neighbouring
 * seconds could name their rotations on different readings, and the display
 * clamped one of them to another rotation (a 104.78 mm jump of the elbow).
 *
 * @param setups Each arm's setup.
 * @param times The knots' seconds, ascending.
 * @param coordinates Each arm's coordinates at each knot.
 * @param arm The arm's index.
 * @returns The arm at a second of the span, held at the first and the last knot outside it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read, by which interpolant, the shoulder's one reading, what the reader retains and its behaviour outside the span.
 * @evidence contracts/development/implementation.md#principled-implementation The interpolant is the one the trajectory is admitted on (`HumanArmTrajectoryAdmission`), so what is played is what was read; the shoulder's reading is continued knot by knot from the first, a pure function of the knots, so a second reads the same whatever was read before it.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One closure over four inputs and the knots' readings.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No pose is stored: every second is interpolated and decoded; the readings kept are the knots' own, never a queried second's.
 * @evidence contracts/development/implementation.md#efficient-algorithms One Hermite read, one chart inversion and one decode per query, with at most three displayed articulations to choose its reading; the knots' readings are decoded once, on the first query, and the knot a second follows is found by bisection.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work A solved trajectory and a laid course are played by this one reader; the knots' readings depend on the knots alone and serve every query.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the setup list, the times, the coordinate arrays and one triple per knot while the reader is held, and nothing else.
 */
export function HumanArmTrajectoryPlayback(
  setups: readonly IAutoMovieMotionHumanArmGeometry.ISetup[],
  times: readonly number[],
  coordinates: readonly (readonly (readonly number[])[])[],
  arm: number,
): (seconds: number) => IAutoMovieMotionHumanArmClearance.IArm {
  const setup: IAutoMovieMotionHumanArmGeometry.ISetup = setups[arm]!;
  let knots: [number, number, number][] | undefined;
  const readings = (): [number, number, number][] => {
    if (knots !== undefined) return knots;
    const made: [number, number, number][] = [];
    coordinates[arm]!.forEach((c: readonly number[], i: number): void => {
      const turned: IAutoMovieQuaternion = G.shoulder(setup, c);
      const alone: readonly [number, number, number] = G.arm(
        setup,
        c,
        turned,
      ).upper;
      made.push(
        i === 0
          ? [alone[0], alone[1], alone[2]]
          : HumanArmBranch(setup, turned, alone, made[i - 1]!),
      );
    });
    knots = made;
    return made;
  };
  return (seconds: number): IAutoMovieMotionHumanArmClearance.IArm => {
    const c: number[] = HumanArmRefine.hermite(
      times,
      coordinates[arm]!,
      seconds,
    );
    const turned: IAutoMovieQuaternion = G.shoulder(setup, c);
    const read: IAutoMovieMotionHumanArmClearance.IArm = G.arm(setup, c, turned);
    const known: [number, number, number][] = readings();
    if (known.length === 0) return read;

    // The last knot at or before the second; the first one before the span.
    let low: number = 0;
    let high: number = times.length - 1;
    while (low < high) {
      const middle: number = (low + high + 1) >> 1;
      if (times[middle]! <= seconds) low = middle;
      else high = middle - 1;
    }
    return {
      ...read,
      upper: HumanArmBranch(
        setup,
        turned,
        read.upper,
        known[Math.min(low, known.length - 1)]!,
      ),
    };
  };
}
