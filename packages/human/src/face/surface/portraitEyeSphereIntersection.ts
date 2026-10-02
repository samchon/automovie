import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { IPortraitEyeSphere } from "./structures/IPortraitEyeSphere";

/**
 * Intersect the sphere on the hemisphere facing the supplied camera direction.
 *
 * @evidence contracts/common.md#principled-implementation Solving |o + t d - c|^2 = r^2 gives t = -b +- sqrt(b^2 - |o-c|^2 + r^2) with b = (o-c).d; the +sqrt root is the intersection on the hemisphere facing the camera. A ray that misses (negative discriminant, non-finite value) is refused.
 * @evidence contracts/common.md#clear-and-simple-design The closed-form ray-sphere solution with one refusal.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No special case or compensating path.
 * @evidence contracts/common.md#meaningful-documentation States which hemisphere is returned; the refusal is described by the error text.
 * @evidence contracts/modeling.md#spatial-conventions Origin, ray and sphere share one frame and unit; nothing is converted.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping portraitEyeSphereIntersection is a pure computation and defines no part or group of parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels portraitEyeSphereIntersection defines and consumes no parameter channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry portraitEyeSphereIntersection decides no primitive population of a form.
 * @evidenceExclude contracts/modeling.md#shared-boundaries portraitEyeSphereIntersection constructs no surface that meets another part.
 * @evidenceExclude contracts/modeling.md#rendered-observation portraitEyeSphereIntersection owns no part, group or joint that a viewer displays; its consumers own the observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source portraitEyeSphereIntersection carries no anatomical value, range, proportion, landmark or tissue behaviour.
 * @evidenceExclude contracts/anatomy.md#permitted-range portraitEyeSphereIntersection admits, bounds and combines no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority portraitEyeSphereIntersection defines no input through which a caller shapes a human form.
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
