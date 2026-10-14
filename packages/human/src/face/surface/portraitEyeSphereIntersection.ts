import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IPortraitEyeSphere } from "./structures/IPortraitEyeSphere";

/**
 * Intersect the sphere on the hemisphere facing the supplied camera direction.
 * Point coordinates and sphere radius use the caller's common length unit.
 * The larger quadratic root selects the supplied direction's hemisphere even
 * when reaching it requires negative travel. Admitted sphere/origin values are
 * caller premises; zero direction and a nonfinite or negative discriminant
 * refuse. This construction does not fit gaze or reconstruct an observed eye.
 *
 * @evidence contracts/common.md#principled-implementation Normalizing the view direction reduces line-sphere intersection to the larger quadratic root; negative travel is retained rather than imposing a forward-ray restriction.
 * @evidence contracts/common.md#clear-and-simple-design One vector intersection consumes an already fitted sphere; source fitting and downstream eye-layer construction remain separate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing intersection refuses without moving or enlarging the sphere; finite output beyond the discriminant check remains a caller premise.
 * @evidence contracts/common.md#meaningful-documentation Prose states common units, hemisphere selection, signed travel, admitted-input premises and refusal conditions.
 * @evidence contracts/performance.md#efficient-algorithms Fixed vector arithmetic and one square root use constant work independent of mesh population.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each intersection depends on its supplied origin and view direction; the helper owns no request coordination.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only one new intersection vector escapes and no caller sphere or direction is retained.
 */
export function portraitEyeSphereIntersection(
  sphere: IPortraitEyeSphere,
  origin: IAutoMovieVector3,
  viewRay: IAutoMovieVector3,
): IAutoMovieVector3 {
  const direction: IAutoMovieVector3 = Vector3.normalize(viewRay);
  const delta: IAutoMovieVector3 = Vector3.subtract(origin, sphere.center);
  const along: number = Vector3.dot(delta, direction);
  const discriminant: number =
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
