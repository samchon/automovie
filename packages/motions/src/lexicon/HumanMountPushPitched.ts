import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanMountPush } from "./HumanMountPush";

/**
 * A goal's foot turned about a point of its own (`pitch`).
 *
 * @param goal The leg's goal.
 * @param rotation The foot's world rotation.
 * @param pivot The point it turns about, world metres.
 * @param turn The turn.
 * @returns The goal with its ankle and foot turned.
 */
export function HumanMountPushPitched(
  goal: IAutoMovieHumanLimbGoal,
  rotation: IAutoMovieQuaternion,
  pivot: IAutoMovieVector3,
  turn: HumanMountPush.IPitch,
): IAutoMovieHumanLimbGoal {
  const down: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    turn.axis,
    turn.degrees,
  );
  return {
    ...goal,
    point: Vector3.add(
      pivot,
      Quaternion.rotateVector(down, Vector3.subtract(goal.point, pivot)),
    ),
    rotation: Quaternion.multiply(down, rotation),
  };
}
