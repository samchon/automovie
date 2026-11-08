import type {
  IAutoMoviePhysicalPointBound as Bound,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { physicalShapeSurfaceAnchor } from "./physicalShapeSurfaceAnchor";
import { physicalSupportPoint } from "./physicalSupportPoint";

/**
 * Evaluate one scalar relationship with coherent same-body motion and an actual external reference. The shape direction is converted from world to bone-local coordinates.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Evaluate one scalar relationship with coherent same-body motion and an actual external reference) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Evaluate one scalar relationship with coherent same-body motion and an actual external reference) directly over its typed inputs (`body`, `profiles`, `actual`, `bound`, `poses`) as nested iteration of depth 2 (find over profiles[bound.reference.body]!.segments; find over profiles[bound.reference.body]!.segments), delegating to `physicalShapeSurfaceAnchor`, `Quaternion.rotateVector`, `Quaternion.inverse`, `physicalSupportPoint`, `Vector3.dot`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (1 throw site). Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 33 lines and 4 top-level statements that reuses `physicalShapeSurfaceAnchor`, `Quaternion.rotateVector`, `Quaternion.inverse`, `physicalSupportPoint`, `Vector3.dot` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 4 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `body`, `profiles`, `actual`, `bound`, `poses`; the dominant cost is nested iteration of depth 2 (find over profiles[bound.reference.body]!.segments; find over profiles[bound.reference.body]!.segments), performed once per call with 1 allocation site (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 1 allocation site become the returned value or die with the call, so nothing grows.
 */
export function physicalPointProjection(
  body: string,
  profiles: Readonly<Record<string, P>>,
  actual: Readonly<Record<string, Readonly<Record<string, P.ITransform>>>>,
  bound: Bound,
  poses: Readonly<Record<string, P.ITransform>>,
): number {
  const reference: P.ITransform | undefined =
    bound.reference.body === body
      ? poses[bound.reference.bone]
      : actual[bound.reference.body]?.[bound.reference.bone];
  if (!reference)
    throw new Error(
      "Point relationship is missing its actual reference: " + bound.id,
    );
  const point: IAutoMovieVector3 =
    bound.reference.shape !== undefined
      ? physicalShapeSurfaceAnchor(
          reference,
          profiles[bound.reference.body]!.segments.find(
            (segment: P.ISegment): boolean =>
              segment.bone === bound.reference.bone,
          )!.shapes.find(
            (shape: P.IShape): boolean => shape.id === bound.reference.shape,
          )!,
          Quaternion.rotateVector(
            Quaternion.inverse(reference.rotation),
            bound.axis,
          ),
        ).point
      : physicalSupportPoint(reference, bound.reference.localPoint);
  return Vector3.dot(
    Vector3.subtract(
      physicalSupportPoint(poses[bound.source.bone]!, bound.source.localPoint),
      point,
    ),
    bound.axis,
  );
}
