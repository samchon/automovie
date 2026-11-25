import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { HumanLimbFit } from "./HumanLimbFit";
import { HumanPosture } from "./HumanPosture";

/**
 * Select world limb fits needed by explicit bone observations. All directly
 * authored joints are already clamped/admitted by the caller. Any requested arm
 * solve, attached/reference/external goal or digit context keeps the complete
 * original fit request.
 */
export function selectHumanPostureGoals(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  requested: ReadonlySet<AutoMovieHumanoidBone>,
): IAutoMovieMotionHumanPosture["limbs"] {
  const limbs: IAutoMovieMotionHumanPosture["limbs"] = posture.limbs;
  if (posture.digits !== undefined) return limbs;
  for (const limb of HumanPosture.LIMBS) {
    const goal: IAutoMovieHumanLimbGoal | undefined = limbs[limb];
    if (goal !== undefined && !simple(goal, limb.endsWith("Leg"))) return limbs;
  }
  const byName: Map<AutoMovieHumanoidBone, IAutoMovieBone> = new Map();
  for (const bone of body.skeleton.bones) byName.set(bone.bone, bone);
  const ancestors: Set<AutoMovieHumanoidBone> = new Set();
  for (const bone of requested) {
    let current: AutoMovieHumanoidBone | null | undefined = bone;
    while (
      current !== undefined &&
      current !== null &&
      !ancestors.has(current)
    ) {
      ancestors.add(current);
      current = byName.get(current)?.parent;
    }
  }
  const selected: IAutoMovieMotionHumanPosture["limbs"] = {};
  for (const limb of HumanPosture.LIMBS) {
    const goal: IAutoMovieHumanLimbGoal | undefined = limbs[limb];
    if (goal === undefined) continue;
    const chain: HumanLimbFit.IChain = HumanLimbFit.chain(limb);
    const changed: AutoMovieHumanoidBone[] = [
      chain.upper,
      chain.lower,
      chain.effector,
    ];
    if (
      limb.endsWith("Leg") &&
      goal.contact !== undefined &&
      goal.rotation !== undefined
    )
      changed.push(limb === "leftLeg" ? "leftToes" : "rightToes");
    if (
      !changed.some((bone: AutoMovieHumanoidBone): boolean =>
        ancestors.has(bone),
      )
    )
      continue;
    if (limb.endsWith("Arm")) return limbs;
    selected[limb] = goal;
  }
  return selected;
}

/** Admit only the fields whose free-world independence the selector proves. */
function simple(goal: IAutoMovieHumanLimbGoal, leg: boolean): boolean {
  return (
    goal.elbow === undefined &&
    goal.limits === undefined &&
    goal.on === undefined &&
    goal.reference === undefined &&
    goal.seed === undefined &&
    goal.clear === undefined &&
    goal.clearExternal === undefined &&
    goal.rests === undefined &&
    goal.restsOwn === undefined &&
    goal.clearanceOn === undefined &&
    (leg || (goal.contact === undefined && goal.planted === undefined))
  );
}