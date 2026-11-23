import type {
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalShapeBounds,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { physicalShapeBounds } from "./physicalShapeBounds";

/**
 * Refuse composed poses, bounds and origin/COM twists that are not finite although their input scalars are, the solver's precondition on every state it is handed. This boundary never clips values or restricts the shared Float64 math helpers.
 */
export function assertPhysicalFiniteMotion(
  segment: IAutoMoviePhysicalSegment,
  pose: IAutoMovieRigidTransform,
  velocity?: IAutoMovieVector3,
  angularVelocity?: IAutoMovieVector3,
): void {
  const offset: IAutoMovieVector3 = Quaternion.rotateVector(
    pose.rotation,
    segment.centerOfMass,
  );
  const values: IAutoMovieVector3[] = [
    pose.position,
    Vector3.add(pose.position, offset),
  ];
  if (velocity !== undefined) {
    values.push(velocity);
    values.push(
      Vector3.add(
        velocity,
        Vector3.cross(angularVelocity ?? { x: 0, y: 0, z: 0 }, offset),
      ),
    );
  }
  if (angularVelocity !== undefined) values.push(angularVelocity);
  for (const shape of segment.shapes) {
    const bounds: IAutoMoviePhysicalShapeBounds.IResult = physicalShapeBounds(
      pose,
      shape,
    );
    values.push(bounds.min, bounds.max);
  }
  if (
    !values.every((value: IAutoMovieVector3): boolean =>
      [value.x, value.y, value.z].every(Number.isFinite),
    )
  )
    throw new Error(
      `Derived pose or velocity is not finite: ${segment.bone}`,
    );
}
