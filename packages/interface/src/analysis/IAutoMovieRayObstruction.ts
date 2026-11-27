import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieAnalysisSolid } from "./IAutoMovieAnalysisSolid";

/** Data and callback contracts shared by the RayObstruction operations. */
export namespace IAutoMovieRayObstruction {
  /**
   * Whether any of the given convex solids stops a ray before `maxDistance`.
   *
   * Solids are tried in list order and the first one that blocks ends the test;
   * an empty list never obstructs. A ray that starts inside a solid is
   * obstructed at once, and one leaving a point exactly on a face is not (see
   * `solidBlocks`).
   */
  export type IProps = {
    /** World-space ray origin in metres. */
    origin: IAutoMovieVector3;

    /** Unit ray direction; `maxDistance` is in metres only when it is unit. */
    direction: IAutoMovieVector3;

    /** Convex blockers, tested in list order. */
    solids: readonly IAutoMovieAnalysisSolid[];

    /** Furthest distance that counts as a hit; `Infinity` for a sky ray. */
    maxDistance: number;
  };
}
