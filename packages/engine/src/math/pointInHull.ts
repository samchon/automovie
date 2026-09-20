import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Is `point` inside (or on the boundary of) a counter-clockwise hull? Always
 * `false` for a degenerate hull of fewer than three vertices (a point or a
 * segment cannot enclose area).
 *
 * @evidence requirements/motion/contact-weight-and-support.md#motion-contact-authority-tolerance Tests whether the projected load point lies inside the current support polygon.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Tests whether the projected load point lies inside the current support polygon.
 */
export const pointInHull = (
  point: IAutoMovieVector3,
  hull: readonly IAutoMovieVector3[],
): boolean => {
  if (hull.length < 3) return false;
  for (let i = 0; i < hull.length; i++)
    if (cross(hull[i]!, hull[(i + 1) % hull.length]!, point) < -EPSILON)
      return false;
  return true;
};

const EPSILON = 1e-9;

const cross = (
  o: IAutoMovieVector3,
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
): number => (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x);
