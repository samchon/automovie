import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFields } from "./HumanFields";

/**
 * Raw translation and the original observable serialization/admission policy.
 * These operations establish no solved-pose or mutable-body capability.
 */
export namespace HumanPostureRaw {
  /** Retain the original finite joint/free-world-leg admission observation. */
  export function eligible(posture: IAutoMovieMotionHumanPosture): boolean {
    {
      if (
        Object.keys(posture).some(
          (key: string): boolean => !POSTURE_KEYS.has(key),
        ) ||
        !vector(posture.root) ||
        ![posture.yaw, posture.pitch, posture.roll].every(Number.isFinite)
      )
        return false;
      for (const joint of Object.values(posture.joints))
        if (
          joint === undefined ||
          joint.length !== 3 ||
          !joint.every(Number.isFinite)
        )
          return false;
      for (const [limb, goal] of Object.entries(posture.limbs)) {
        if ((limb !== "leftLeg" && limb !== "rightLeg") || goal === undefined)
          return false;
        if (
          !goalFields(goal) ||
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
      if (
        posture.rotation !== undefined &&
        (!vector(posture.rotation.about) ||
          ![
            posture.rotation.turn.x,
            posture.rotation.turn.y,
            posture.rotation.turn.z,
            posture.rotation.turn.w,
          ].every(Number.isFinite) ||
          Object.keys(posture.rotation).some(
            (key: string): boolean => key !== "about" && key !== "turn",
          ))
      )
        return false;
      return true;
    }
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

  /** Keep the original point/bend/rotation-only enumerable goal-key domain. */
  export function goalFields(goal: IAutoMovieHumanLimbGoal): boolean {
    return !Object.keys(goal).some(
      (key: string): boolean => !GOAL_KEYS.has(key),
    );
  }
}

/** The posture fields inside the raw proof domain. */
const POSTURE_FIELDS = [
  "root",
  "yaw",
  "pitch",
  "roll",
  "joints",
  "limbs",
  "rotation",
] as const satisfies ReadonlyArray<keyof IAutoMovieMotionHumanPosture>;

/** The posture fields that carry context outside it. */
const POSTURE_CONTEXT = ["digits"] as const satisfies ReadonlyArray<
  keyof IAutoMovieMotionHumanPosture
>;

/** The posture fields neither list classifies: never while both are complete. */
type IUnlistedPostureField = HumanFields.Unlisted<
  IAutoMovieMotionHumanPosture,
  (typeof POSTURE_FIELDS)[number],
  (typeof POSTURE_CONTEXT)[number]
>;

/** Other top-level fields carry context outside this raw proof domain. */
const POSTURE_KEYS: ReadonlySet<string> = HumanFields.admitted<
  IAutoMovieMotionHumanPosture,
  IUnlistedPostureField
>(POSTURE_FIELDS);

/** The goal fields inside the raw proof domain. */
const GOAL_FIELDS = [
  "point",
  "bend",
  "rotation",
] as const satisfies ReadonlyArray<keyof IAutoMovieHumanLimbGoal>;

/** Contact/plant/reference/external contexts require ordinary solving. */
const GOAL_CONTEXT = [
  "elbow",
  "planted",
  "contact",
  "limits",
  "on",
  "reference",
  "seed",
  "clear",
  "clearExternal",
  "rests",
  "restsOwn",
  "clearanceOn",
] as const satisfies ReadonlyArray<keyof IAutoMovieHumanLimbGoal>;

/** The goal fields neither list classifies: never while both are complete. */
type IUnlistedGoalField = HumanFields.Unlisted<
  IAutoMovieHumanLimbGoal,
  (typeof GOAL_FIELDS)[number],
  (typeof GOAL_CONTEXT)[number]
>;

/** The goal fields the raw domain admits. */
const GOAL_KEYS: ReadonlySet<string> = HumanFields.admitted<
  IAutoMovieHumanLimbGoal,
  IUnlistedGoalField
>(GOAL_FIELDS);
