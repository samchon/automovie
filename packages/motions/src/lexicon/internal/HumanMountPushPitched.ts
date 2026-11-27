import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanMountPush } from "./HumanMountPush";

/*
 * A goal's foot turned about a point of its own (`pitch`).
 * Parameter goal: The leg's goal.
 * Parameter rotation: The foot's world rotation.
 * Parameter pivot: The point it turns about, world metres.
 * Parameter turn: The turn.
 * Returns: The goal with its ankle and foot turned.
 */
export function HumanMountPushPitched(
  goal: IAutoMovieHumanLimbGoal,
  rotation: IAutoMovieQuaternion,
  pivot: IAutoMovieVector3,
  turn: HumanMountPush.IPitch,
): IAutoMovieHumanLimbGoal {
  const down: IAutoMovieQuaternion = AutoMovieEngineQuaternion.fromAxisAngle(
    turn.axis,
    turn.degrees,
  );
  return {
    ...goal,
    point: AutoMovieEngineVector3.add(
      pivot,
      AutoMovieEngineQuaternion.rotateVector(down, AutoMovieEngineVector3.subtract(goal.point, pivot)),
    ),
    rotation: AutoMovieEngineQuaternion.multiply(down, rotation),
  };
}
