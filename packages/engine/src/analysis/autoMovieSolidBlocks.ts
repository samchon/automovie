import {
  IAutoMovieHalfSpacePlane,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";

/**
 * A ray whose slope against a plane, the cosine between the ray and the plane's
 * unit normal, is this small or smaller runs parallel to it.
 */
const PLANE_EPSILON: number = 1e-12;

/**
 * Whether a ray from `origin` along a unit `direction` is stopped by one convex
 * solid before `maxDistance`.
 *
 * The slab test over half-spaces, done analytically rather than by marching:
 * every plane either raises the entry parameter or lowers the exit one, and the
 * solid is hit exactly when an interval survives with a positive exit. A ray
 * that starts inside the solid is blocked at once, which is the right answer
 * for a sample point buried in a mass.
 *
 * Normals need not be normalized: the numerator and the denominator scale
 * together, so the parameter is unaffected by how long an authored normal is,
 * and the parallel test compares the slope against the normal's own length, so
 * it is too. A point is inside a plane when `dot(normal, point) <= offset`. A
 * ray leaving from a point exactly on a face is not blocked, because a hit
 * needs a positive exit. A ray whose slope against a plane is `1e-12` or less
 * is treated as never crossing it: starting outside that plane means a miss,
 * and starting inside leaves the other planes to decide.
 *
 * @evidence contracts/common.md#principled-implementation Cyrus-Beck clipping of the parametric ray against each half-space, narrowing `[enter, exit]` from `[0, maxDistance]` with an early return once it empties; exact for convex solids, assuming `direction` is unit so the parameter is metres, and the parallel band is measured as the cosine against the unit normal so a plane's verdict does not depend on how long its authored normal is.
 * @evidence contracts/common.md#clear-and-simple-design One function answers one solid; the union over solids belongs to `autoMovieRayObstructed`, and the inside convention matches the one `validateSolidPlanes` documents.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The parallel branch is geometric, not a fixture case: within the band the ray would meet the plane only at an astronomical parameter, so only its side decides, which keeps sky rays from hitting a face through rounding noise in the direction.
 * @evidence contracts/common.md#meaningful-documentation The documentation states the slab method, the inside convention, the start-inside and on-face outcomes, scale invariance of both the parameter and the parallel test, and the parallel band; each property states its unit or meaning.
 * @evidence contracts/performance.md#efficient-algorithms One pass over the P planes, O(P), with two dot products and one normal length each and no allocation, returning early on a separating parallel plane or an emptied interval.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call tests one ray against one solid; rays differ in origin or direction, so there is no equivalent result to share, and the caller decides how often it runs.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Keeps only the entry and exit parameters as locals while scanning the caller's planes, holding no reference after it returns.
 * @author Samchon
 */
export const autoMovieSolidBlocks = (props: {
  /** World-space ray origin in metres. */
  origin: IAutoMovieVector3;

  /** Unit ray direction. */
  direction: IAutoMovieVector3;

  /** Half-spaces whose intersection is the solid. */
  planes: readonly IAutoMovieHalfSpacePlane[];

  /** Furthest parameter that counts as a hit; `Infinity` for a sky ray. */
  maxDistance: number;
}): boolean => {
  let enter: number = 0;
  let exit: number = props.maxDistance;
  for (const plane of props.planes) {
    const denominator: number = Vector3.dot(plane.normal, props.direction);
    const distance: number =
      plane.offset - Vector3.dot(plane.normal, props.origin);
    if (Math.abs(denominator) <= PLANE_EPSILON * Vector3.length(plane.normal)) {
      // Parallel to this face: either forever inside it, or forever outside.
      if (distance < 0) return false;
      continue;
    }
    const parameter: number = distance / denominator;
    if (denominator > 0) exit = Math.min(exit, parameter);
    else enter = Math.max(enter, parameter);
    if (enter > exit) return false;
  }
  return exit > 0;
};
