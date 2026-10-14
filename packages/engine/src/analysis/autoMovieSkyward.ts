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
 * zero vector and makes every direction non-skyward. The ground's elevation is
 * not read, because a direction, unlike a point, has no height.
 *
 * @param direction Direction to classify; any length.
 * @param ground Reference ground whose `up` defines the horizon.
 * @returns `true` when the direction rises above the horizon.
 *
 * @evidence contracts/common.md#principled-implementation Tests the dot product with normalized ground up using strict greater-than-zero, putting grazing directions on the ground side. The daylight caller supplies unit sampled directions, so its products stay bounded; arbitrary large directions are not normalized or admitted here and their dot sum can overflow or cancel to NaN.
 * @evidence contracts/common.md#clear-and-simple-design One predicate names the horizon rule the daylight sky estimate filters its directions with, kept apart from the hemisphere sampler because the ground and the workplane normal are independent.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No direction or context is special-cased; the zero-up behavior is the math library's zero normalization, and the context validator refuses that input before any study runs.
 * @evidence contracts/common.md#meaningful-documentation The documentation states the strict horizon rule, that neither vector needs unit length, the zero-up behavior and who refuses it, and why the elevation is ignored.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Constant time: one normalization and one dot product, with no algorithm to choose.
 * @evidence contracts/performance.md#reuse-equivalent-work The daylight analyzer evaluates it once per sky direction per study and keeps the skyward subset for every cell, instead of re-testing each direction at every cell, which is valid because the answer depends only on the direction and the study's ground.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates one normalized vector per call and retains nothing.
 * @author Samchon
 */
export const autoMovieSkyward: (direction: IAutoMovieVector3, ground: IAutoMovieReferenceGround) => boolean = (
  direction: IAutoMovieVector3,
  ground: IAutoMovieReferenceGround,
): boolean => Vector3.dot(direction, Vector3.normalize(ground.up)) > 0;
