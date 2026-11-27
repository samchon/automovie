import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineQuaternion } from "../AutoMovieEngineQuaternion";
import { AutoMovieEngineVector3 } from "../AutoMovieEngineVector3";

/*
 * Shortest-arc rotation operations for finite directions.
 */
export namespace AutoMovieEngineMathRotation {
/*
 * Shortest-arc rotation from finite vector `a` to finite vector `b`, using
 * atan2 without a near-parallel identity deadzone. Iterative world-driver IK
 * and analytic two-bone aiming share this direction and collinearity
 * convention.
 *
 * The predecessor (`quatFromTo`) snapped `cos > 0.999999` to the identity,
 * which put a ~1.9e-3 m convergence floor under the iterative IK solvers and
 * made the aim/reach path ignore its last ~0.08°. Sub-0.1° corrections are the
 * moves a late solver sweep, a foot plant, or a slow camera track needs.
 * Representable nonzero cross products stay active, subject to binary64
 * precision in normalization and quaternion conversion (#643).
 *
 * Both inputs are normalized before computing sine and cosine, avoiding
 * overflow from their original magnitudes. The cross-product axis is normalized
 * by `fromAxisAngle`. Callers needing named finite-input refusal validate first
 * (see `aimRotation`). A degenerate input (zero vector, exact parallel)
 * degrades to the identity; exact antiparallel takes a deterministic 180° flip
 * about a perpendicular (the `|a.x| < 0.9` axis split).
 */
export function rotationBetween(
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
): IAutoMovieQuaternion {
  const from: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(a);
  const to: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(b);
  return turn(from, to);
}

/*
 * Fixed-source shortest-arc preparation for repeated target directions.
 */
/*
 * Normalize and own one source direction, then compute every requested
 * target's shortest arc through the direct function's same core. The caller
 * supplies finite vectors as in the direct entry; named finite refusal
 * belongs to aimRotation. Changing the original source afterward does not
 * alter this explicit snapshot. Zero/parallel/antiparallel inputs retain the
 * direct identity/perpendicular convention.
 *
 * The direct normalization is target-independent, so its completed vector
 * serves the same cross/dot/atan2 and axis-angle core for every separately
 * normalized target. Setup and each query use constant work; one closure owns
 * the source vector until caller release. No prior target, angle or
 * quaternion is retained, and direct calls keep live source normalization.
 */
export function prepareRotationBetween(
  source: IAutoMovieVector3,
): (target: IAutoMovieVector3) => IAutoMovieQuaternion {
  const from: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(source);
  return (target: IAutoMovieVector3): IAutoMovieQuaternion =>
    turn(from, AutoMovieEngineVector3.normalize(target));
}

/*
 * Exact normalized-direction core, shared by ordinary and fixed-source turns.
 */
function turn(
  from: IAutoMovieVector3,
  to: IAutoMovieVector3,
): IAutoMovieQuaternion {
  const cross: IAutoMovieVector3 = AutoMovieEngineVector3.cross(from, to);
  const sin: number = AutoMovieEngineVector3.length(cross);
  const cos: number = AutoMovieEngineVector3.dot(from, to);
  if (sin === 0) {
    if (cos >= 0) return AutoMovieEngineQuaternion.identity();
    const perp: IAutoMovieVector3 =
      Math.abs(from.x) < 0.9
        ? AutoMovieEngineVector3.cross(from, { x: 1, y: 0, z: 0 })
        : AutoMovieEngineVector3.cross(from, { x: 0, y: 1, z: 0 });
    return AutoMovieEngineQuaternion.fromAxisAngle(perp, 180);
  }
  return AutoMovieEngineQuaternion.fromAxisAngle(
    cross,
    (Math.atan2(sin, cos) * 180) / Math.PI,
  );
}
}
