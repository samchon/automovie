import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieAnalysisSolid } from "./IAutoMovieAnalysisSolid";

/**
 * Data and callback contracts shared by the RayObstruction operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Whether any of the given convex solids stops a ray before `maxDistance`. Member documentation states the supplied records, units and absence meanings used by autoMovieRayObstructed.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The query borrows canonical solids and vectors; it does not encode normalized length or admitted half-spaces, so these remain caller premises for autoMovieRayObstructed.
 * @evidence contracts/development/design.md#principled-representation origin is in world metres, direction must be unit length for metre-valued maxDistance, and solids are tested in their supplied order; Infinity permits an unbounded sky ray.
 * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieRayObstruction, used by autoMovieRayObstructed. Its IProps members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
 */
export namespace IAutoMovieRayObstruction {
  /**
   * Whether any of the given convex solids stops a ray before `maxDistance`.
   *
   * Solids are tried in list order and the first one that blocks ends the test;
   * an empty list never obstructs. A ray that starts inside a solid is obstructed
   * at once, and one leaving a point exactly on a face is not (see
   * `autoMovieSolidBlocks`).
   *
   * @evidence contracts/development/common.md#meaningful-documentation Whether any of the given convex solids stops a ray before `maxDistance`. Member documentation states the supplied records, units and absence meanings used by autoMovieRayObstructed.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The query borrows canonical solids and vectors; it does not encode normalized length or admitted half-spaces, so these remain caller premises for autoMovieRayObstructed.
   * @evidence contracts/development/design.md#principled-representation origin is in world metres, direction must be unit length for metre-valued maxDistance, and solids are tested in their supplied order; Infinity permits an unbounded sky ray.
   * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieRayObstruction.IProps, used by autoMovieRayObstructed. Its origin, direction, solids, maxDistance members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
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
