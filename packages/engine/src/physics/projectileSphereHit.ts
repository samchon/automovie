import { Vector3 } from "../math/Vector3";
import { IAutoMovieProjectile } from "./IAutoMovieProjectile";
import { projectileAt } from "./projectileAt";
import { IAutoMovieHit } from "./IAutoMovieHit";
import { IAutoMovieSphere } from "./IAutoMovieSphere";
import { segmentSphere } from "./segmentSphere";

/**
 * March a {@link IAutoMovieProjectile} over `[0, tMax]` in `steps` straight
 * segments and return the first time/point its path enters `sphere`, or `null`
 * if it never does within the window. Sampling the arc as segments keeps the
 * test exact per segment (the projectile is smooth, so a modest `steps`
 * resolves the contact time closely).
 *
 * @evidence requirements/effects-and-simulation/rigid-motion-ballistics-and-collision.md#effects-impact-consequence Returns the first bounded contact along an analytic projectile path.
 * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#collision-proxy-and-world-contact-output Produces the contact time and point consumed by aftermath logic.
 * @author Samchon
 */
export const projectileSphereHit = (
  projectile: IAutoMovieProjectile,
  sphere: IAutoMovieSphere,
  tMax: number,
  steps = 120,
): IAutoMovieHit | null => {
  if (!Number.isFinite(tMax))
    throw new RangeError(`projectile hit tMax must be finite, but was ${tMax}`);
  if (!(tMax > 0))
    throw new RangeError(`projectile hit tMax must be > 0, but was ${tMax}`);
  if (!Number.isInteger(steps))
    throw new RangeError(
      `projectile hit steps must be an integer, but was ${steps}`,
    );
  if (steps < 1)
    throw new RangeError(`projectile hit steps must be >= 1, but was ${steps}`);

  const dt = tMax / steps;
  let prev = projectileAt(projectile, 0).position;
  for (let i = 1; i <= steps; ++i) {
    const t = i * dt;
    const cur = projectileAt(projectile, t).position;
    const s = segmentSphere(prev, cur, sphere.center, sphere.radius);
    if (s !== null)
      return {
        time: (i - 1) * dt + s * dt,
        point: Vector3.lerp(prev, cur, s),
      };
    prev = cur;
  }
  return null;
};
