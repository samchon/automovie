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
 */
export const autoMovieSkyward = (
  direction: IAutoMovieVector3,
  ground: IAutoMovieReferenceGround,
): boolean => Vector3.dot(direction, Vector3.normalize(ground.up)) > 0;
