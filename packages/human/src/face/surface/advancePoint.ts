import { Vector3 } from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The point moved `distance` along the unit direction `forward`, refusing a
 * result outside the finite coordinate domain. Shared by the directional
 * contact and intersection constructors.
 *
 * @author Samchon
 */
export function advancePoint(
  point: IAutoMovieVector3,
  forward: IAutoMovieVector3,
  distance: number,
): IAutoMovieVector3 {
  const result = Vector3.add(point, Vector3.scale(forward, distance));
  if (![result.x, result.y, result.z].every(Number.isFinite))
    throw new Error(
      "Directional contact exceeds its finite coordinate domain.",
    );
  return result;
}
