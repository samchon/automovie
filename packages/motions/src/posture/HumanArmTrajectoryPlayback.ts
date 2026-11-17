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
 * @param setups Each arm's setup.
 * @param times The knots' seconds, ascending.
 * @param coordinates Each arm's coordinates at each knot.
 * @param arm The arm's index.
 * @returns The arm at a second of the span, held at the first and the last knot outside it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read, by which interpolant, what the reader retains and its behaviour outside the span.
 * @evidence contracts/development/implementation.md#principled-implementation The interpolant is the one the trajectory is admitted on (`HumanArmTrajectoryAdmission`), so what is played is what was read.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One closure over four inputs.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No pose is stored: every second is interpolated and decoded.
 * @evidence contracts/development/implementation.md#efficient-algorithms One Hermite read and one decode per query.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work A solved trajectory and a laid course are played by this one reader.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the setup list, the times and the coordinate arrays while the reader is held, and nothing else.
 */
export function HumanArmTrajectoryPlayback(
  setups: readonly G.ISetup[],
  times: readonly number[],
  coordinates: readonly (readonly (readonly number[])[])[],
  arm: number,
): (seconds: number) => HumanArmClearance.IArm {
  return (seconds: number): HumanArmClearance.IArm =>
    G.arm(setups[arm]!, HumanArmRefine.hermite(times, coordinates[arm]!, seconds));
}
