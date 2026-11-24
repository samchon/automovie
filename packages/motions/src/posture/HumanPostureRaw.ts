import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Raw translation and the original observable serialization/admission policy.
 * These operations establish no solved-pose or mutable-body capability.
 */
export namespace HumanPostureRaw {
  /**
   * Whether the posture lies in the raw proof domain: no digit goals, finite
   * root and angles, finite joint triples, only free leg goals and an optional
   * finite rigid rotation.
   */
  export function eligible(posture: IAutoMovieMotionHumanPosture): boolean {
    if (
      posture.digits !== undefined ||
      !vector(posture.root) ||
      ![posture.yaw, posture.pitch, posture.roll].every(Number.isFinite)
    )
      return false;
    for (const joint of Object.values(posture.joints))
      if (joint === undefined || !joint.every(Number.isFinite)) return false;
    for (const [limb, goal] of Object.entries(posture.limbs)) {
      if ((limb !== "leftLeg" && limb !== "rightLeg") || goal === undefined)
        return false;
      if (
        !free(goal) ||
        !vector(goal.point) ||
        !vector(goal.bend) ||
        (goal.rotation !== undefined &&
          ![
            goal.rotation.x,
            goal.rotation.y,
            goal.rotation.z,
            goal.rotation.w,
          ].every(Number.isFinite))
      )
        return false;
    }
    return (
      posture.rotation === undefined ||
      (vector(posture.rotation.about) &&
        [
          posture.rotation.turn.x,
          posture.rotation.turn.y,
          posture.rotation.turn.z,
          posture.rotation.turn.w,
        ].every(Number.isFinite))
    );
  }
  /** Observe the existing complete JSON walk, distinguishing signed zero. */
  export function signature(
    posture: IAutoMovieMotionHumanPosture,
  ): string | undefined {
    return JSON.stringify(posture, (_key: string, value: unknown): unknown =>
      typeof value === "number" && Object.is(value, -0) ? "number:-0" : value,
    );
  }

  /** Copy original demands and apply one world-metre displacement per goal. */
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

  /** Check the existing three finite vector reads in x/y/z order. */
  export function vector(value: IAutoMovieVector3): boolean {
    return (
      Number.isFinite(value.x) &&
      Number.isFinite(value.y) &&
      Number.isFinite(value.z)
    );
  }

  /**
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
