import type {
  IAutoMovieMotionHumanArmClearance,
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import { HumanArmBranch } from "./HumanArmBranch";
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
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One private coordinate curve supplies both the exact coordinates and preceding knot for branch selection.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No pose is stored: every second is interpolated and decoded; the readings kept are the knots' own, never a queried second's.
 * @evidence contracts/development/implementation.md#efficient-algorithms One interval lookup supplies the Hermite segment and shoulder chart together. Actual knot differences and spans are prepared once, and the knot charts are decoded once.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work A solved trajectory and a laid course are played by this one reader; the knots' readings depend on the knots alone and serve every query.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains just the selected setup, a private copy of its knot times and coordinate rows, their Hermite tangents and one chart triple per knot while the reader is held.
 */
export function HumanArmTrajectoryPlayback(
  setups: readonly IAutoMovieMotionHumanArmGeometry.ISetup[],
  times: readonly number[],
  coordinates: readonly (readonly (readonly number[])[])[],
  arm: number,
): (seconds: number) => IAutoMovieMotionHumanArmClearance.IArm {
  const setup: IAutoMovieMotionHumanArmGeometry.ISetup = setups[arm]!;
  const rows: number[][] = coordinates[arm]!.map(
    (row: readonly number[]): number[] => [...row],
  );
  const curve: ReturnType<typeof HumanArmRefine.prepareHermite> =
    HumanArmRefine.prepareHermite([...times], rows);
  let knots: [number, number, number][] | undefined;
  const readings = (): [number, number, number][] => {
    if (knots !== undefined) return knots;
    const made: [number, number, number][] = [];
    rows.forEach((c: readonly number[], i: number): void => {
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
    const { knot, coordinates: c }: ReturnType<typeof curve> = curve(seconds);
    const turned: IAutoMovieQuaternion = G.shoulder(setup, c);
    const read: IAutoMovieMotionHumanArmClearance.IArm = G.arm(
      setup,
      c,
      turned,
    );
    const known: [number, number, number][] = readings();
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
