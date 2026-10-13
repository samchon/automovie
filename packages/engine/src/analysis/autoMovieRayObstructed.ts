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
 *
 * @evidence contracts/common.md#principled-implementation Reduces occlusion by a union of convex solids to `Array.prototype.some` over per-solid slab tests, which is exact because a ray is stopped by the union exactly when one member stops it.
 * @evidence contracts/common.md#clear-and-simple-design Owns only the iteration over solids, leaving `autoMovieSolidBlocks` a pure single-solid geometry test; the daylight study's beam, sky and luminaire rays all go through this wrapper.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Context masses and authored shades arrive as one `IAutoMovieAnalysisSolid[]` and are tested identically, with no branch on a solid's id or origin list.
 * @evidence contracts/common.md#meaningful-documentation States the union semantics, list-order short-circuit, empty-list result, the inside-start and on-face rules, and documents each property including the unit-direction premise of `maxDistance`.
 * @evidence contracts/performance.md#cost-and-resources O(solids × planes) per ray with a short circuit at the first blocker and no bounding box or spatial index, so the occluder count scales every one of the daylight study's grid points × (sky directions + luminaires + 1) rays. Caches nothing because rays differ in origin or direction, and retains nothing beyond one short-lived props object per solid tested.
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
