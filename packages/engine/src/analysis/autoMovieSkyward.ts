import {
  IAutoMovieReferenceGround,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";

/**
 * Whether a direction points strictly above the reference ground plane, that
 * is, has a positive component along `ground.up`.
 *
 * A direction lying on the horizon is not skyward. Neither vector needs unit
 * length. `ground.up` must be non-zero, which
 * `validateAutoMovieEnvironmentContext` requires; a zero up normalizes to the
 * zero vector and makes every direction non-skyward.
 *
 * @evidence contracts/common.md#principled-implementation A sign test on the dot product with the ground's up vector, classifying a direction against the horizon plane; the strict `> 0` puts grazing directions on the ground side, and ground elevation is irrelevant because no point is classified.
 * @evidence contracts/common.md#clear-and-simple-design Names the horizon rule once so the daylight sky estimator does not inline a dot product against the context's up vector.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No direction or context is special-cased; the zero-up behavior is the math library's zero normalization, and the context validator refuses that input before any study runs.
 * @evidence contracts/common.md#meaningful-documentation States the strict horizon rule, that neither vector must be unit length, and the non-zero premise on `ground.up` with what happens without it.
 * @evidence contracts/performance.md#cost-and-resources Constant time per call, but it renormalizes `ground.up` each time, allocating a vector that cannot change the dot product's sign, and the daylight sky loop re-evaluates it at every grid point for the same direction set, so directions × points tests and allocations repeat work a once-per-run skyward filter would do. Retains nothing.
 */
export const autoMovieSkyward = (
  direction: IAutoMovieVector3,
  ground: IAutoMovieReferenceGround,
): boolean => Vector3.dot(direction, Vector3.normalize(ground.up)) > 0;
