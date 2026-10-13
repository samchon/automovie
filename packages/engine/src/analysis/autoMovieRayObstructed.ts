import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieAnalysisSolid } from "./IAutoMovieAnalysisSolid";
import { autoMovieSolidBlocks } from "./autoMovieSolidBlocks";

/**
 * Whether any of the given convex solids stops a ray before `maxDistance`.
 *
 * Solids are tried in list order and the first one that blocks ends the test;
 * an empty list never obstructs. A ray that starts inside a solid is obstructed
 * at once, and one leaving a point exactly on a face is not (see
 * `autoMovieSolidBlocks`).
 */
export const autoMovieRayObstructed = (props: {
  /** World-space ray origin in metres. */
  origin: IAutoMovieVector3;

  /** Unit ray direction; `maxDistance` is in metres only when it is unit. */
  direction: IAutoMovieVector3;

  /** Convex blockers, tested in list order. */
  solids: readonly IAutoMovieAnalysisSolid[];

  /** Furthest distance that counts as a hit; `Infinity` for a sky ray. */
  maxDistance: number;
}): boolean =>
  props.solids.some((solid) =>
    autoMovieSolidBlocks({
      origin: props.origin,
      direction: props.direction,
      planes: solid.planes,
      maxDistance: props.maxDistance,
    }),
  );
