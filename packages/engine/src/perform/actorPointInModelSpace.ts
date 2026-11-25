import {
  type IAutoMovieActorWorldFrame,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";

/**
 * Undo an actor's rigid world frame to express a world metre point in its model
 * frame. The frame has translation and a quaternion rotation, with no scale.
 */
export const actorPointInModelSpace: (
  world: IAutoMovieVector3,
  frame: IAutoMovieActorWorldFrame,
) => IAutoMovieVector3 = (
  world: IAutoMovieVector3,
  frame: IAutoMovieActorWorldFrame,
): IAutoMovieVector3 =>
  Quaternion.rotateVector(
    Quaternion.inverse(frame.rotation),
    Vector3.subtract(world, frame.position),
  );
