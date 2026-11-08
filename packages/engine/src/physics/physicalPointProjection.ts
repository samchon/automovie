import type {
  IAutoMoviePhysicalPointBound as Bound,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { physicalShapeSurfaceAnchor } from "./physicalShapeSurfaceAnchor";
import { physicalSupportPoint } from "./physicalSupportPoint";

/** Evaluate one scalar relationship with coherent same-body motion and an actual external reference. The shape direction is converted from world to bone-local coordinates. */
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
