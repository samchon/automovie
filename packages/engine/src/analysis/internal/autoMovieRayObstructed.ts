import type {
  IAutoMovieAnalysisSolid,
  IAutoMovieRayObstruction,
} from "@automovie/interface";

import { autoMovieSolidBlocks } from "./autoMovieSolidBlocks";

/**
 * Whether any of the given convex solids stops a ray before `maxDistance`.
 *
 * Solids are tried in list order and the first one that blocks ends the test;
 * an empty list never obstructs. A ray that starts inside a solid is obstructed
 * at once, and one leaving a point exactly on a face is not (see
 * `autoMovieSolidBlocks`).
 */
export function autoMovieRayObstructed(
  props: IAutoMovieRayObstruction.IProps,
): boolean {
  return props.solids.some((solid: IAutoMovieAnalysisSolid): boolean =>
    autoMovieSolidBlocks({
      origin: props.origin,
      direction: props.direction,
      planes: solid.planes,
      maxDistance: props.maxDistance,
    }),
  );
}
