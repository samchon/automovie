import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Intersect the shoulder's rigid horizontal path with all wrist reach
 * spheres, since the pelvis follows half the foot's displacement.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the geometry, controlling ratio and first feasible result.
 * @evidence contracts/development/implementation.md#principled-implementation Intersect the analytic line-sphere roots, then scale the nearest interval endpoint back into step distance.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass computes the intersection.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reach bounds and maximum foot travel are supplied by the caller.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the number of wrist spheres with no search.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call depends on its own line and target geometry.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Pure function retaining no state.
 */
export function pickUpStepReach(
  from: IAutoMovieVector3,
  toward: IAutoMovieVector3,
  places: readonly pickUpStepReach.IReach[],
  longest: number,
): pickUpStepReach.Distance {
  let near: number = 0;
  let far: number = longest / 2;
  for (const [point, reach] of places) {
    const delta: IAutoMovieVector3 = Vector3.subtract(point, from);
    const along: number = Vector3.dot(delta, toward);
    const halfSquared: number = reach * reach + along * along - Vector3.dot(delta, delta);
    if (halfSquared < 0) return null;
    const half: number = Math.sqrt(halfSquared);
    near = Math.max(near, along - half);
    far = Math.min(far, along + half);
  }
  return near <= far ? 2 * near : null;
}


/** The reach spheres and the common interval of their line intersections. */
export namespace pickUpStepReach {
  /** A wrist centre and its permitted shoulder distance, world metres. */
  export type IReach = readonly [point: IAutoMovieVector3, reach: number];

  /** A feasible step length in metres, or null when the spheres do not overlap along the line. */
  export type Distance = number | null;
}
