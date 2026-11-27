import {
  type IAutoMovieActorWorldFrame,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineQuaternion } from "../../math/AutoMovieEngineQuaternion";
import { AutoMovieEngineVector3 } from "../../math/AutoMovieEngineVector3";

/*
 * Undo an actor's rigid world frame to express a world metre point in its model
 * frame. The frame has translation and a quaternion rotation, with no scale.
 */
export function actorPointInModelSpace(
  world: IAutoMovieVector3,
  frame: IAutoMovieActorWorldFrame,
): IAutoMovieVector3 {
  return AutoMovieEngineQuaternion.rotateVector(
    AutoMovieEngineQuaternion.inverse(frame.rotation),
    AutoMovieEngineVector3.subtract(world, frame.position),
  );
}
