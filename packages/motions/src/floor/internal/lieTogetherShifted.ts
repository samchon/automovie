import { AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * A posture slid across the support: its root and every world limb goal moved.
 */
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
              point: AutoMovieEngineVector3.add(goal.point, by),
              bend: AutoMovieEngineVector3.add(goal.bend, by),
            };
  }
  return { ...posture, root: AutoMovieEngineVector3.add(posture.root, by), limbs };
}

/*
 * A posture's limb.
 */
type Limb = keyof IAutoMovieMotionHumanPosture["limbs"];

/*
 * The limb-goal sites a translated posture can contain.
 */
const LIMBS: readonly Limb[] = ["leftArm", "rightArm", "leftLeg", "rightLeg"];
