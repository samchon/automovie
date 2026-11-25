import type {
  IAutoMovieHit,
  IAutoMovieProjectile,
  IAutoMovieSphere,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { projectileAt } from "./projectileAt";
import { segmentSphere } from "./segmentSphere";

/**
 * March a {@link IAutoMovieProjectile} over `[0, tMax]` in `steps` straight
 * segments and return the first time/point its path enters `sphere`, or `null`
 * if it never does within the window. Sampling the arc as segments keeps the
 * test exact per segment (the projectile is smooth, so a modest `steps`
 * resolves the contact time closely).
 */
export const projectileSphereHit: (
  projectile: IAutoMovieProjectile,
  sphere: IAutoMovieSphere,
  tMax: number,
  steps?: number,
) => IAutoMovieHit | null = (
  projectile: IAutoMovieProjectile,
  sphere: IAutoMovieSphere,
  tMax: number,
  steps: number = 120,
): IAutoMovieHit | null => {
  if (tMax <= 0)
    throw new RangeError(`projectile hit tMax must be > 0, but was ${tMax}`);
  if (steps < 1)
    throw new RangeError(`projectile hit steps must be >= 1, but was ${steps}`);

  const dt: number = tMax / steps;
  let prev: IAutoMovieVector3 = projectileAt(projectile, 0).position;
  for (let i: number = 1; i <= steps; ++i) {
    const t: number = i * dt;
    const cur: IAutoMovieVector3 = projectileAt(projectile, t).position;
    const s: number | null = segmentSphere(
      prev,
      cur,
      sphere.center,
      sphere.radius,
    );
    if (s !== null)
      return {
        time: (i - 1) * dt + s * dt,
        point: Vector3.lerp(prev, cur, s),
      };
    prev = cur;
  }
  return null;
};
