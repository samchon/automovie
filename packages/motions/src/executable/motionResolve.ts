import { AutoMovieMotionHumanResolve } from "../compose/AutoMovieMotionHumanResolve";
import { MotionBodies } from "./MotionBodies";

/**
 * Prints what every place name, height, lateral, distance, elbow preset and
 * range level is on each body of the capture sweep, so an author reads a
 * spec's metres and degrees before running a capture.
 *
 * Run it with `pnpm --filter @automovie/motions node:resolve`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is printed, for which bodies, and the command.
 * @evidence contracts/development/implementation.md#principled-implementation The table is `AutoMovieMotionHumanResolve.table` over the polygon men of `MotionBodies.SWEEP`, the bodies every capture runs on.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One call and one write.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Formats nothing itself.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the sweep and the table owner.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One table with no algorithm to choose.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Runs once and exits.
 */
const main = (): void => {
  console.log(
    AutoMovieMotionHumanResolve.table(
      MotionBodies.SWEEP.map(
        (name: string): AutoMovieMotionHumanResolve.IBody => ({
          name,
          body: MotionBodies.population(name),
        }),
      ),
    ),
  );
};
main();
