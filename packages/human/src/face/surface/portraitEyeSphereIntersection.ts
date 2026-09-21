import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { IPortraitEyeSphere } from "./structures/IPortraitEyeSphere";

/**
 * Intersect the sphere on the hemisphere facing the supplied camera direction.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Projects observed lid contact onto the camera-facing hemisphere of its resident globe.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Solves the view-direction ray/sphere intersection and refuses a zero direction or nonfinite or negative discriminant.
 */
export function portraitEyeSphereIntersection(
  sphere: IPortraitEyeSphere,
  origin: IAutoMovieVector3,
  viewRay: IAutoMovieVector3,
): IAutoMovieVector3 {
  const direction = Vector3.normalize(viewRay);
  const delta = Vector3.subtract(origin, sphere.center);
  const along = Vector3.dot(delta, direction);
  const discriminant =
    along ** 2 - Vector3.dot(delta, delta) + sphere.radius ** 2;
  if (
    Vector3.length(direction) === 0 ||
    !Number.isFinite(discriminant) ||
    discriminant < 0
  )
    throw new Error("The measured eye ray misses the fitted sphere.");
  return Vector3.add(
    origin,
    Vector3.scale(direction, -along + Math.sqrt(discriminant)),
  );
}
