import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanPosture } from "./IHumanPosture";
import { hipJoints } from "./hipJoints";
import { resolveHumanPosture } from "./resolveHumanPosture";
import { prepareHumanPoseResolution } from "./prepareHumanPoseResolution";

/** The lowering law always observes its two legs in this original order. */
const SIDES: readonly ["left", "right"] = Object.freeze(["left", "right"] as const);

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
 * @evidence contracts/development/common.md#meaningful-documentation States gravity-axis lowering, minimum knee degrees, original targets and synchronous FK borrowing; prepare binds an unchanged body/knee with lazy first-use reach production. short/prepareShort document metre/degree inputs, live versus fixed dimensions, negative slack and the horizontally-unreachable -Infinity result.
 * @evidence contracts/development/implementation.md#principled-implementation Actual pelvis-to-hip FK supplies origins. The common reachLimit applies a*a+b*b+2*a*b*cos(knee) and its square root to actual thigh/shank lengths; reachDrop removes horizontal span through the original Pythagoras/comparison/subtraction grouping. Raw short reads live dimensions each time; prepareShort genuinely computes that fixed-body/knee prerequisite once. Taking the greatest required drop keeps the original cleanup rule.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Raw lowering and prepare share one current-goal/hip/drop owner. Its scalar source is either the original live short or prepare's privately created lazy fixed-reach reader. Both use reachLimit/reachDrop, separating fixed segment geometry from every current hip/ankle query without duplicating lowering or allocating per-query callbacks.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Attached goals stay outside the world-root solve. short retains -Infinity at or beyond horizontal reach and negative slack when the leg reaches; no target, knee threshold, tolerance or replacement contact is introduced.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most two goals and one two-hip demand FK precede constant scalar work per leg; fixed side order allocates no per-query side array. No FK reader is allocated/invoked without a world plant, and an actual supplied loan dispatches directly without a discarded lazy wrapper. prepare pays fixed-body/knee cosine/reach square root once after the first actual hip read; prepareShort exposes the same prerequisite. Each query retains horizontal hypot, reach comparison and vertical square root. Runtime improvement is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work A supplied same-person reader shares exact FK prerequisites; changed root/pelvis remain visible. Raw lowering/short reread body dimensions; explicit prepare/prepareShort own only the computed fixed-knee reach and require new preparation on dimension/knee changes. Every world-plant selection, hip and ankle is read anew and no lowering answer is memoized.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Lowering's local goals/hip frames/getter end on return or throw. prepare retains its unchanged body/knee and at most one private scalar reader until its plan owner releases it; no posture, borrowed operation or result enters that closure. A prepareShort reader retains one reach number without body/points. Neither path stores query history, handles or tasks.
 */
export function lowerHumanPosture(
  body: IHumanBody,
  posture: IHumanPosture,
  knee: number = resolveHumanPosture.KNEE,
  resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
): IHumanPosture {
  return lower(body, posture, knee, resolution);
}

/** One current-goal/hip/drop law; the optional scalar reader belongs only to this producer. */
function lower(
  body: IHumanBody,
  posture: IHumanPosture,
  knee: number,
  resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  readShort?: ReturnType<typeof lowerHumanPosture.prepareShort>,
): IHumanPosture {
  // Only world-anchored plants are lowered for: a leg goal attached to a
  // bone moves with that bone, so the root cannot be solved against it here.
  const legs: { side: "left" | "right"; goal: IAutoMovieVector3 }[] = [];
  for (const side of SIDES) {
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
    resolution === undefined ? undefined : prepareHumanPoseResolution.read(resolution),
  );
  let drop: number = 0;
  for (const { side, goal } of legs)
    drop = Math.max(
      drop,
      readShort === undefined
        ? lowerHumanPosture.short(body, hips[side], goal, knee)
        : readShort(hips[side], goal),
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
 * @evidence contracts/development/design.md#minimal-and-owned-surface Lowering and existing reach readers use short; travel ground trials use prepareShort and jump push/landing use prepare to bind actual fixed dimensions/knee. All share one scalar geometry/current-posture law without alternative solver state or a caller admission flag.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses each actual body's thigh/shank lengths rather than a fixed person or replacement contact target.
 */
export namespace lowerHumanPosture {
  /**
   * Bind the actual unchanged body and minimum knee degrees for repeated
   * current-posture lowering. Every query still collects its world plants,
   * resolves current hips with its own optional synchronous FK loan and runs
   * the original greatest-drop law. The first actual leg's scalar read,
   * after hip FK, lazily prepares fixed reach once through prepareShort;
   * no-plant paths read neither dimensions nor the FK supplier.
   *
   * All strict horizontal comparisons, negative slack, -Infinity and output
   * identity rules stay with the raw law. Body dimensions/knee must remain
   * unchanged or be prepared again. Two factory closures and at most one
   * scalar-reach reader remain with the caller; postures, loans, points and
   * results are never retained, and each query performs its actual geometry.
   */
  export function prepare(
    body: IHumanBody,
    knee: number = resolveHumanPosture.KNEE,
  ): (posture: IHumanPosture, resolution?: Parameters<typeof prepareHumanPoseResolution>[0]) => IHumanPosture {
    let short: ReturnType<typeof prepareShort> | undefined;
    const read: ReturnType<typeof prepareShort> = (hip: IAutoMovieVector3, ankle: IAutoMovieVector3): number => {
      short ??= prepareShort(body, knee);
      return short(hip, ankle);
    };
    return (posture: IHumanPosture, resolution?: Parameters<typeof prepareHumanPoseResolution>[0]): IHumanPosture =>
      lower(body, posture, knee, resolution, read);
  }

  /**
   * Prepare actual fixed thigh/shank lengths and minimum knee degrees once.
   * The cosine-law reach and its square root are computed by the same owner
   * as raw short. Each returned read still evaluates its current world-metre
   * hip/ankle hypot, strict reach comparison and vertical subtraction/square
   * root in the original order, including negative slack and -Infinity.
   * Keep dimensions and knee unchanged or prepare again; no input validation,
   * threshold, clamp or target substitution is added. Preparation and reads
   * are constant-time; only one reach scalar survives until caller release,
   * without retaining the body, points or any query-result history.
   */
  export function prepareShort(
    body: IHumanBody,
    knee: number,
  ): (hip: IAutoMovieVector3, ankle: IAutoMovieVector3) => number {
    const limit: number = reachLimit(body, knee);
    return (hip: IAutoMovieVector3, ankle: IAutoMovieVector3): number =>
      reachDrop(limit, hip, ankle);
  }

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
    return reachDrop(reachLimit(body, knee), hip, ankle);
  }
}

/** Compute the original fixed two-segment cosine-law reach in metres. */
function reachLimit(body: IHumanBody, knee: number): number {
  const a: number = body.measure.thigh;
  const b: number = body.measure.shank;
  return Math.sqrt(a * a + b * b + 2 * a * b * Math.cos((knee * Math.PI) / 180));
}

/** Read current points under the original strict horizontal reach and subtraction law. */
function reachDrop(limit: number, hip: IAutoMovieVector3, ankle: IAutoMovieVector3): number {
  const dh: number = Math.hypot(hip.x - ankle.x, hip.z - ankle.z);
  return dh < limit ? hip.y - ankle.y - Math.sqrt(limit * limit - dh * dh) : -Infinity;
}
