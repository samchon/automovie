import type {
  IAutoMovieMotionHumanArmClearance,
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import { HumanArmBranch } from "./HumanArmBranch";
import { HumanArmGeometry as G } from "./HumanArmGeometry";
import { HumanArmTrajectoryKnots } from "./HumanArmTrajectoryKnots";

/**
 * One arm's reader of a trajectory's knots: the arm at any second, the knots'
 * C² quintic Hermite interpolant (`HumanArmRefine.hermite`) read back as
 * clinical triples. It owns only the playback's inputs, so a returned reader
 * keeps none of the problem, the contexts or the readings it was solved with.
 *
 * The shoulder's triple is read on one reading along the whole trajectory
 * (`HumanArmBranch`): the first knot's is decoded alone, each later knot's is
 * the reading nearest the knot before it, and a second between two knots is
 * read nearest the knot it follows. Decoded alone, two neighbouring seconds
 * could name their rotations on different readings, and the display clamped one
 * of them to another rotation (a 104.78 mm jump of the elbow).
 *
 * @param setups Each arm's setup.
 * @param times The knots' seconds, ascending.
 * @param coordinates Each arm's coordinates at each knot.
 * @param arm The arm's index.
 * @param rates The bounded per-knot velocities and accelerations used by
 *   admission. Each quintic meets both knots' position and rates.
 * @returns The arm at a second of the span, held at the first and the last knot
 *   outside it.
 */
export function HumanArmTrajectoryPlayback(
  setups: readonly IAutoMovieMotionHumanArmGeometry.ISetup[],
  times: readonly number[],
  coordinates: readonly (readonly (readonly number[])[])[],
  arm: number,
  rates: HumanArmTrajectoryKnots.IRates,
): (seconds: number) => IAutoMovieMotionHumanArmClearance.IArm {
  const setup: IAutoMovieMotionHumanArmGeometry.ISetup = setups[arm]!;
  const rows: number[][] = coordinates[arm]!.map(
    (row: readonly number[]): number[] => [...row],
  );
  const clock: number[] = [...times];
  const curve: (seconds: number) => HumanArmTrajectoryKnots.IPosition =
    HumanArmTrajectoryKnots.positions(
      clock,
      rows,
      rates.velocities[arm]!,
      rates.accelerations[arm]!,
    );
  // Each knot's shoulder reading, each the nearest the knot before it.
  const known: [number, number, number][] = [];
  rows.forEach((c: readonly number[], i: number): void => {
    const turned: IAutoMovieQuaternion = G.shoulder(setup, c);
    const alone: readonly [number, number, number] = G.arm(
      setup,
      c,
      turned,
    ).upper;
    known.push(
      i === 0
        ? [alone[0], alone[1], alone[2]]
        : HumanArmBranch(setup, turned, alone, known[i - 1]!),
    );
  });
  return (seconds: number): IAutoMovieMotionHumanArmClearance.IArm => {
    const { knot, coordinates: c }: ReturnType<typeof curve> = curve(seconds);
    const turned: IAutoMovieQuaternion = G.shoulder(setup, c);
    const read: IAutoMovieMotionHumanArmClearance.IArm = G.arm(
      setup,
      c,
      turned,
    );
    if (known.length === 0) return read;
    return {
      ...read,
      upper: HumanArmBranch(
        setup,
        turned,
        read.upper,
        known[Math.min(knot, known.length - 1)]!,
      ),
    };
  };
}
