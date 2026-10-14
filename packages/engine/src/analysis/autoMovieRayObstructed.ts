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
 * @evidence contracts/common.md#principled-implementation Reduces occlusion by a union of convex solids to `Array.prototype.some` over per-solid slab tests, which is exact because a ray is stopped by the union exactly when one member stops it, and `some` stops at the first blocker.
 * @evidence contracts/common.md#clear-and-simple-design One function owns the union over solids so every daylight light component asks one question; the per-solid geometry stays in `autoMovieSolidBlocks`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Context masses and authored shades arrive as one `IAutoMovieAnalysisSolid[]` and are tested identically, with no branch on a solid's id or origin list.
 * @evidence contracts/common.md#meaningful-documentation The documentation states the order and short circuit, the empty-list answer, the start-inside and on-face outcomes, and each property's unit, including that `maxDistance` is metres only for a unit direction.
 * @evidence contracts/performance.md#efficient-algorithms O(N·P) per ray for N solids of P planes with a short circuit at the first blocker; no bounding volume or spatial index prunes solids, so the daylight study pays the full solid count on every one of its cells × (sky directions + luminaires + 1) unobstructed rays.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call answers one ray; rays differ in origin or direction, so no answer is equivalent to another's.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains nothing; the only allocation is one short-lived props object per solid tested, released when the test returns.
 * @author Samchon
 */
export const autoMovieRayObstructed: (props: { origin: IAutoMovieVector3; direction: IAutoMovieVector3; solids: readonly IAutoMovieAnalysisSolid[]; maxDistance: number; }) => boolean = (props: {
  /** World-space ray origin in metres. */
  origin: IAutoMovieVector3;

  /** Unit ray direction; `maxDistance` is in metres only when it is unit. */
  direction: IAutoMovieVector3;

  /** Convex blockers, tested in list order. */
  solids: readonly IAutoMovieAnalysisSolid[];

  /** Furthest distance that counts as a hit; `Infinity` for a sky ray. */
  maxDistance: number;
}): boolean =>
  props.solids.some(
    (solid: IAutoMovieAnalysisSolid): boolean =>
      autoMovieSolidBlocks({
        origin: props.origin,
        direction: props.direction,
        planes: solid.planes,
        maxDistance: props.maxDistance,
      }),
  );
