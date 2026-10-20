import type { IAutoMovieVector3 } from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { IAutoMovieHit } from "./IAutoMovieHit";
import { IAutoMovieProjectile } from "./IAutoMovieProjectile";
import { IAutoMovieSphere } from "./IAutoMovieSphere";
import { projectileAt } from "./projectileAt";
import { segmentSphere } from "./segmentSphere";

/**
 * March a {@link IAutoMovieProjectile} over `[0, tMax]` in `steps` straight
 * segments and return the first time/point its path enters `sphere`, or `null`
 * if it never does within the window. Sampling the arc as segments keeps the
 * test exact per segment (the projectile is smooth, so a modest `steps`
 * resolves the contact time closely).
 *
 *
 * @evidence contracts/common.md#principled-implementation Subdivide [0,tMax] into equal time chords, use segmentSphere for the first chord entry, and interpolate its point and time. This approximates a curved ballistic path and can miss curvature between samples.
 * @evidence contracts/common.md#clear-and-simple-design The time loop owns sampling while projectileAt and segmentSphere own motion and analytic chord intersection; no collision engine is embedded.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Default 120 steps is the exposed sampling policy, not a fixture-tuned answer; null means no sampled chord hit rather than proof of no continuous-path collision.
 * @evidence contracts/common.md#meaningful-documentation Docs identify positive finite tMax, positive integer steps, hit time in seconds and chord-interpolated point; callback-free invalid arguments throw.
 * @evidence contracts/performance.md#efficient-algorithms Up to S steps require O(S) constant-size state evaluations and intersections, retaining only adjacent states and the first hit.
 * @evidence contracts/performance.md#reuse-equivalent-work Each previous endpoint is reused as the next chord start; no trajectory array or cross-projectile cache is built.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The loop returns immediately on hit and retains O(1) vectors; no task or handle survives null, hit or failure.
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
