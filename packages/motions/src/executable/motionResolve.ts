import type { IAutoMovieMotionHumanResolve } from "@automovie/interface";

import { AutoMovieMotionHumanBody } from "../body/AutoMovieMotionHumanBody";
import { AutoMovieMotionHumanResolve } from "../compose/internal/AutoMovieMotionHumanResolve";
import { MotionBodies } from "./internal/MotionBodies";
import type { humanPolygonMan } from "./internal/humanPolygonMan";

/**
 * Prints what every place name, height, lateral, distance, elbow preset and
 * range level is on each body of the capture sweep, then the solved elbow
 * beside the `hang` preset on each of them, so an author reads a spec's metres
 * and degrees before running a capture.
 *
 * Run it with `pnpm --filter @automovie/motions node:resolve`.
 */
const main = (): void => {
  const men: humanPolygonMan.IPolygonMan[] = MotionBodies.SWEEP.map(
    (name: string): humanPolygonMan.IPolygonMan =>
      MotionBodies.population(name),
  );
  console.log(
    AutoMovieMotionHumanResolve.table(
      men.map(
        (
          man: humanPolygonMan.IPolygonMan,
        ): IAutoMovieMotionHumanResolve.IBody => ({
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
        body: AutoMovieMotionHumanBody.create(
          man.body.skeleton,
          man.body.profile,
        ),
      })),
    ),
  );
};
main();
