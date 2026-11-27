import {
  IAutoMovieReferenceGround,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../../math/Vector3";

/*
 * Whether a direction points strictly above the reference ground plane, that
 * is, has a positive component along `ground.up`.
 *
 * A direction lying on the horizon is not skyward. Neither vector needs unit
 * length. `ground.up` must be non-zero, which
 * `validateAutoMovieEnvironmentContext` requires; a zero up normalizes to the
 * zero vector and makes every direction non-skyward. The ground's elevation is
 * not read, because a direction, unlike a point, has no height.
 * Parameter direction: Direction to classify; any length.
 * Parameter ground: Reference ground whose `up` defines the horizon.
 * Returns: `true` when the direction rises above the horizon.
 */
export function autoMovieSkyward(
  direction: IAutoMovieVector3,
  ground: IAutoMovieReferenceGround,
): boolean {
  return Vector3.dot(direction, Vector3.normalize(ground.up)) > 0;
}
