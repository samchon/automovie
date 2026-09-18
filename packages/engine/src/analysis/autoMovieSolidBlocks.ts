import { IAutoMovieHalfSpacePlane, IAutoMovieVector3 } from "@automovie/interface";
import { Vector3 } from "../math/Vector3";

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
 * together, so the parameter is unaffected by how long an authored normal is.
 *
 * @evidence requirements/map/weather-and-seasons.md#map-calendar-time-celestial-state `autoMovieSolidBlocks` determines whether one declared context mass interrupts a finite analysis ray.
 * @evidence specifications/world-and-site/ecology-weather-and-calendar.md#world-site-calendar-time-celestial-input The slab intersection narrows entry and exit parameters across every half-space and accepts only a surviving positive segment.
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
  let enter = 0;
  let exit = props.maxDistance;
  for (const plane of props.planes) {
    const denominator = Vector3.dot(plane.normal, props.direction);
    const distance = plane.offset - Vector3.dot(plane.normal, props.origin);
    if (Math.abs(denominator) <= PLANE_EPSILON) {
      // Parallel to this face: either forever inside it, or forever outside.
      if (distance < 0) return false;
      continue;
    }
    const parameter = distance / denominator;
    if (denominator > 0) exit = Math.min(exit, parameter);
    else enter = Math.max(enter, parameter);
    if (enter > exit) return false;
  }
  return exit > 0;
};

/** A ray whose slope against a plane is under this is parallel to it. */
const PLANE_EPSILON = 1e-12;
