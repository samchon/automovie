import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * The stick's model frame: its shaft, face and across axes, the rest point of
 * its prepared curves, and a model point moved into the world.
 */
export namespace stickBallModel {
  /** The producer's shaft axis in its model frame. */
  export const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

  /** The producer's open playing-face direction. */
  export const FORWARD: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };

  /** The across-stick rotation axis. */
  export const SIDE: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };

  /** Stationary endpoint for the stroke's prepared curves. */
  export const REST: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };

  /** Apply a model's rigid frame to one of its local points. */
  export function world(
    frame: IAutoMovieRigidTransform,
    local: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    return Vector3.add(
      frame.position,
      Quaternion.rotateVector(frame.rotation, local),
    );
  }
}
