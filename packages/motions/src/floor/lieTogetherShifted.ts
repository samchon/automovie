import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

/** A posture slid across the support: its root and every world limb goal moved. */
export function lieTogetherShifted(
  posture: IAutoMovieMotionHumanPosture,
  by: IAutoMovieVector3,
): IAutoMovieMotionHumanPosture {
  const limbs: IAutoMovieMotionHumanPosture["limbs"] = {};
  for (const name of LIMBS) {
    const goal: IAutoMovieHumanLimbGoal | undefined = posture.limbs[name];
    if (goal !== undefined)
      limbs[name] =
        goal.on !== undefined
          ? goal
          : {
              ...goal,
              point: Vector3.add(goal.point, by),
              bend: Vector3.add(goal.bend, by),
            };
  }
  return { ...posture, root: Vector3.add(posture.root, by), limbs };
}

/** A posture's limb. */
type Limb = keyof IAutoMovieMotionHumanPosture["limbs"];

/** The limb-goal sites a translated posture can contain. */
const LIMBS: readonly Limb[] = ["leftArm", "rightArm", "leftLeg", "rightLeg"];
