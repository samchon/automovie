import type { IAutoMovieRigidTransform, IAutoMovieQuaternion } from "@automovie/interface";

import {
  AutoMovieEngineQuaternion,
  AutoMovieEngineVector3,
} from "@automovie/engine";

import type { HumanMountRider } from "./HumanMountRider";

export namespace HumanHandrimStrokeData {
  /*
   * Carry a sampled grip from one chair placement into another.
   */
  export const carry = (
    grip: Grip,
    from: IAutoMovieRigidTransform,
    to: IAutoMovieRigidTransform,
  ): Grip => {
    const swing: IAutoMovieQuaternion = AutoMovieEngineQuaternion.multiply(
      to.rotation,
      AutoMovieEngineQuaternion.inverse(from.rotation),
    );
    return {
      ...grip,
      point: AutoMovieEngineVector3.add(
        to.position,
        AutoMovieEngineQuaternion.rotateVector(
          swing,
          AutoMovieEngineVector3.subtract(grip.point, from.position),
        ),
      ),
      normal: AutoMovieEngineQuaternion.rotateVector(swing, grip.normal),
      axis: AutoMovieEngineQuaternion.rotateVector(swing, grip.axis!),
    };
  };

  /*
   * The point and directions a rider uses to take the rim.
   */
  export type Grip = Parameters<typeof HumanMountRider.hold>[3];
}
