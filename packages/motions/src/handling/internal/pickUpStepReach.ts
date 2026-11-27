import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

/*
 * Intersect the shoulder's rigid horizontal path with all wrist reach spheres,
 * since the pelvis follows half the foot's displacement.
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
    const halfSquared: number =
      reach * reach + along * along - Vector3.dot(delta, delta);
    if (halfSquared < 0) return null;
    const half: number = Math.sqrt(halfSquared);
    near = Math.max(near, along - half);
    far = Math.min(far, along + half);
  }
  return near <= far ? 2 * near : null;
}

/*
 * The reach spheres and the common interval of their line intersections.
 */
export namespace pickUpStepReach {
  /*
   * A wrist centre and its permitted shoulder distance, world metres.
   */
  export type IReach = readonly [point: IAutoMovieVector3, reach: number];

  /*
   * A feasible step length in metres, or null when the spheres do not overlap
   * along the line.
   */
  export type Distance = number | null;
}
