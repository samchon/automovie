import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanPosture } from "./IHumanPosture";
import { hipJoints } from "./hipJoints";
import { resolveHumanPosture } from "./resolveHumanPosture";
import { prepareHumanPoseResolution } from "./prepareHumanPoseResolution";

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
 * @param resolution Optional exact FK reader or lazy supplier borrowed from this synchronous person evaluation; never requested without an actual planted-leg read.
 * @returns The posture, its root lowered when needed.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States gravity-axis lowering, minimum knee degrees, original targets and synchronous FK borrowing; short below documents metre/degree inputs, negative slack and the horizontally-unreachable -Infinity result.
 * @evidence contracts/development/implementation.md#principled-implementation Actual pelvis-to-hip FK supplies origins; short applies the cosine law a*a+b*b+2*a*b*cos(knee) to measured thigh/shank lengths, then Pythagoras removes horizontal span to determine each maximum vertical reach. Taking the greatest required drop preserves the existing footskate-cleanup rule and exact arithmetic.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Collects actual world-anchored planted goals, reads both hip origins once, and delegates each scalar lowering to short.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Attached goals stay outside the world-root solve. short retains -Infinity at or beyond horizontal reach and negative slack when the leg reaches; no target, knee threshold, tolerance or replacement contact is introduced.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most two goals and one two-hip ancestor-demand FK precede short's constant scalar cosine/Pythagoras work per leg. No FK reader is allocated/invoked without a world plant, and short itself traverses no rig or retained state.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work A supplied same-person reader shares only exact FK prerequisites with later pose/guard reads; absent supply uses the ordinary call-local FK path. Changed root/pelvis inputs remain actual dependencies and no reader is created for absent supply.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Local goals, hip frames and a lazy getter release on return or throw; only the original or lowered posture escapes, with no reader, pose history, handle or task retained.
 */
export function lowerHumanPosture(
  body: IHumanBody,
  posture: IHumanPosture,
  knee: number = resolveHumanPosture.KNEE,
  resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
): IHumanPosture {
  // Only world-anchored plants are lowered for: a leg goal attached to a
  // bone moves with that bone, so the root cannot be solved against it here.
  const legs: { side: "left" | "right"; goal: IAutoMovieVector3 }[] = [];
  for (const side of ["left", "right"] as const) {
    const goal: IHumanPosture.IGoal | undefined = posture.limbs[`${side}Leg`];
    if (goal?.planted === true && goal.on === undefined)
      legs.push({ side, goal: goal.point });
  }
  if (legs.length === 0) return posture;
  const hips: Record<"left" | "right", IAutoMovieVector3> = hipJoints(
    body,
    posture.root,
    resolveHumanPosture.heading(posture),
    posture.joints.hips,
    resolution === undefined ? undefined : prepareHumanPoseResolution(resolution)(),
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

/**
 * Scalar reach geometry used by posture lowering.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the metre-valued knee-reach helper and its unsupported horizontal-reach result.
 * @evidence contracts/development/design.md#principled-representation The body's measured two-segment leg and clinical knee flexion determine a spherical hip-to-ankle reach.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The short helper is consumed by lowering and existing reach readers; no alternative solver state is represented.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses each actual body's thigh/shank lengths rather than a fixed person or replacement contact target.
 */
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
   *
   * The cosine law gives squared reach a*a+b*b+2*a*b*cos(knee), and
   * Pythagoras removes horizontal span to recover maximum vertical reach.
   * Equality/outside reach keeps -Infinity; no target displacement or clamp
   * is introduced. This constant scalar query traverses no rig, coordinates
   * no cross-query result and retains no body, input or external resource.
   */
  export function short(
    body: IHumanBody,
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
