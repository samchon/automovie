import type {
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { isPhysicalNativeNumber as scalar } from "./isPhysicalNativeNumber";
import { physicalShapeBounds } from "./physicalShapeBounds";

/** Refuse composed native poses, bounds and origin/COM twists which overflow f32 even though their input scalars are finite. This boundary never clips values or restricts the shared Float64 math helpers. */
export function assertPhysicalNativeMotion(
  segment: P.ISegment,
  pose: P.ITransform,
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
    const bounds: ReturnType<typeof physicalShapeBounds> = physicalShapeBounds(
      pose,
      shape,
    );
    values.push(bounds.min, bounds.max);
  }
  if (
    !values.every((value: IAutoMovieVector3): boolean =>
      [value.x, value.y, value.z].every(scalar),
    )
  )
    throw new Error(
      `Derived native pose or velocity exceeds f32 range: ${segment.bone}`,
    );
}
