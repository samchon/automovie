import type { IAutoMovieRigidTransform } from "@automovie/interface";
import type { IAutoMovieQuaternion } from "@automovie/interface";
import { Quaternion } from "@automovie/engine";
import { Vector3 } from "@automovie/engine";
import type { HumanMountRider } from "./HumanMountRider";

/*
 * Carry a sampled grip from one chair placement into another.
 */
export const carry = (
  grip: Grip,
  from: IAutoMovieRigidTransform,
  to: IAutoMovieRigidTransform,
): Grip => {
  const swing: IAutoMovieQuaternion = Quaternion.multiply(
    to.rotation,
    Quaternion.inverse(from.rotation),
  );
  return {
    ...grip,
    point: Vector3.add(
      to.position,
      Quaternion.rotateVector(
        swing,
        Vector3.subtract(grip.point, from.position),
      ),
    ),
    normal: Quaternion.rotateVector(swing, grip.normal),
    axis: Quaternion.rotateVector(swing, grip.axis!),
  };
};

/*
 * The point and directions a rider uses to take the rim.
 */
export type Grip = Parameters<typeof HumanMountRider.hold>[3];
