import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * Raw translation and the original admission policy.
 * These operations establish no solved-pose or mutable-body capability.
 */
export namespace HumanPostureRaw {
  /*
   * Whether the posture lies in the raw proof domain: no digit goals and only
   * free leg goals.
   */
  export function eligible(posture: IAutoMovieMotionHumanPosture): boolean {
    if (posture.digits !== undefined) return false;
    for (const [limb, goal] of Object.entries(posture.limbs))
      if (
        (limb !== "leftLeg" && limb !== "rightLeg") ||
        goal === undefined ||
        !free(goal)
      )
        return false;
    return true;
  }
  /*
   * Copy original demands and apply one world-metre displacement per goal.
   */
  export function translated(
    source: IAutoMovieMotionHumanPosture,
    root: IAutoMovieVector3,
  ): IAutoMovieMotionHumanPosture {
    const out: IAutoMovieMotionHumanPosture = structuredClone(source);
    const delta: IAutoMovieVector3 = Vector3.subtract(root, source.root);
    out.root = { ...root };
    const shifted: Set<object> = new Set();
    for (const goal of Object.values(out.limbs)) {
      if (goal === undefined || goal.on !== undefined || shifted.has(goal))
        continue;
      shifted.add(goal);
      goal.point = Vector3.add(goal.point, delta);
      goal.bend = Vector3.add(goal.bend, delta);
    }
    for (const goal of Object.values(out.digits ?? {}))
      if (goal !== undefined && goal.on === undefined && !shifted.has(goal)) {
        shifted.add(goal);
        goal.point = Vector3.add(goal.point, delta);
      }
    if (out.rotation !== undefined)
      out.rotation.about = Vector3.add(out.rotation.about, delta);
    return out;
  }

  /*
   * Whether the goal is free: it sets none of the declared contact, plant,
   * reference or collider contexts, which require ordinary solving.
   */
  export function free(goal: IAutoMovieHumanLimbGoal): boolean {
    return (
      goal.elbow === undefined &&
      goal.planted === undefined &&
      goal.contact === undefined &&
      goal.limits === undefined &&
      goal.on === undefined &&
      goal.reference === undefined &&
      goal.seed === undefined &&
      goal.clear === undefined &&
      goal.clearExternal === undefined &&
      goal.rests === undefined &&
      goal.restsOwn === undefined &&
      goal.clearanceOn === undefined
    );
  }
}
