import { createHumanBody } from "../body/createHumanBody";
import { AutoMovieMotionHumanResolve } from "../compose/AutoMovieMotionHumanResolve";
import { MotionBodies } from "./MotionBodies";
import type { humanPolygonMan } from "./humanPolygonMan";

/**
 * Prints what every place name, height, lateral, distance, elbow preset and
 * range level is on each body of the capture sweep, then the solved elbow
 * beside the `hang` preset on each of them, so an author reads a spec's
 * metres and degrees before running a capture.
 *
 * Run it with `pnpm --filter @automovie/motions node:resolve`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is printed, for which bodies, and the command.
 * @evidence contracts/development/implementation.md#principled-implementation The tables are `AutoMovieMotionHumanResolve.table` and `swivel` over the polygon men of `MotionBodies.SWEEP`, the bodies every capture runs on.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One body list, two calls and one write.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Formats nothing itself.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the sweep, `createHumanBody` and the table owner.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Two tables with no algorithm to choose.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Runs once and exits.
 */
const main = (): void => {
  const men: humanPolygonMan.IPolygonMan[] = MotionBodies.SWEEP.map(
    (name: string): humanPolygonMan.IPolygonMan => MotionBodies.population(name),
  );
  console.log(
    AutoMovieMotionHumanResolve.table(
      men.map(
        (man: humanPolygonMan.IPolygonMan): AutoMovieMotionHumanResolve.IBody => ({
          name: man.id,
          body: man,
        }),
      ),
    ),
  );
  console.log("");
  console.log(
    AutoMovieMotionHumanResolve.swivel(
      men.map((man: humanPolygonMan.IPolygonMan) => ({
        name: man.id,
        body: createHumanBody(man.body.skeleton, man.body.profile),
      })),
    ),
  );
};
main();
