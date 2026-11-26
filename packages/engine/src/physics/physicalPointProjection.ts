import type {
  IAutoMoviePhysicalPointBound,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalShape,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { physicalShapeSurfaceAnchor } from "./internal/physicalShapeSurfaceAnchor";
import { physicalSupportPoint } from "./internal/physicalSupportPoint";

/**
 * Evaluate one scalar relationship with coherent same-body motion and an actual
 * external reference. The shape direction is converted from world to bone-local
 * coordinates.
 */
export function physicalPointProjection(
  body: string,
  profiles: Readonly<Record<string, IAutoMoviePhysicalProfile>>,
  actual: Readonly<
    Record<string, Readonly<Record<string, IAutoMovieRigidTransform>>>
  >,
  bound: IAutoMoviePhysicalPointBound,
  poses: Readonly<Record<string, IAutoMovieRigidTransform>>,
): number {
  const reference: IAutoMovieRigidTransform | undefined =
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
            (segment: IAutoMoviePhysicalSegment): boolean =>
              segment.bone === bound.reference.bone,
          )!.shapes.find(
            (shape: IAutoMoviePhysicalShape): boolean =>
              shape.id === bound.reference.shape,
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
