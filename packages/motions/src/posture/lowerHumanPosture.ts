import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { hipJoints } from "./hipJoints";
import { resolveHumanPosture } from "./resolveHumanPosture";

/**
 * A posture with its root lowered along gravity to the highest height at
 * which every planted leg reaches its goal with at least `knee` degrees of
 * knee flexion: a standing body bends its knees rather than letting a foot
 * leave its plant, the root adjustment of footskate cleanup (Kovar,
 * Schreiner and Gleicher 2002). The hip joints are read from the posture's
 * root, heading and trunk joints, so a turned or listed pelvis counts. A
 * leg whose goal lies horizontally beyond its reach cannot be helped by
 * lowering and is left to the audits.
 *
 * @param body The performer's body.
 * @param posture The posture; legs with `planted` goals are kept reachable.
 * @param knee The least knee flexion, degrees; a planted leg's (`resolveHumanPosture.KNEE`) when absent.
 * @returns The posture, its root lowered when needed.
 */
export function lowerHumanPosture(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  knee: number = resolveHumanPosture.KNEE,
): IAutoMovieMotionHumanPosture {
  // Only world-anchored plants are lowered for: a leg goal attached to a
  // bone moves with that bone, so the root cannot be solved against it here.
  const legs: { side: "left" | "right"; goal: IAutoMovieVector3 }[] = [];
  for (const side of ["left", "right"] as const) {
    const goal: IAutoMovieHumanLimbGoal | undefined =
      posture.limbs[`${side}Leg`];
    if (goal?.planted === true && goal.on === undefined)
      legs.push({ side, goal: goal.point });
  }
  if (legs.length === 0) return posture;
  const hips: Record<"left" | "right", IAutoMovieVector3> = hipJoints(
    body,
    posture.root,
    resolveHumanPosture.heading(posture),
    posture.joints.hips,
  );
  let drop: number = 0;
  for (const { side, goal } of legs)
    drop = Math.max(
      drop,
      lowerHumanPosture.short(body, hips[side], goal, knee),
    );
  return drop === 0
    ? posture
    : { ...posture, root: { ...posture.root, y: posture.root.y - drop } };
}

/** Companion helpers of {@link lowerHumanPosture}. */
export namespace lowerHumanPosture {
  /**
   * How far a hip joint stands above the height from which its leg reaches an
   * ankle with `knee` degrees of knee flexion: the lowering that leg asks of
   * the root, by Pythagoras on the leg's length at that flexion and the
   * ankle's horizontal distance.
   *
   * @param body The performer's body.
   * @param hip The hip joint, world metres.
   * @param ankle The ankle, world metres.
   * @param knee The least knee flexion, degrees.
   * @returns Metres, negative by the slack of a leg that reaches with more
   *   flexion, and `-Infinity` for an ankle horizontally beyond the leg's
   *   reach, which no lowering helps.
   */
  export function short(
    body: IAutoMovieMotionHumanBody,
    hip: IAutoMovieVector3,
    ankle: IAutoMovieVector3,
    knee: number,
  ): number {
    const a: number = body.measure.thigh;
    const b: number = body.measure.shank;
    const limit: number = Math.sqrt(
      a * a + b * b + 2 * a * b * Math.cos((knee * Math.PI) / 180),
    );
    const dh: number = Math.hypot(hip.x - ankle.x, hip.z - ankle.z);
    return dh < limit
      ? hip.y - ankle.y - Math.sqrt(limit * limit - dh * dh)
      : -Infinity;
  }
}
