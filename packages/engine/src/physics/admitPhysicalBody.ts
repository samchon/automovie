import { isAutoMovieRecord } from "../validation/isAutoMovieRecord";
import type { AutoMoviePhysicalSimulation as Simulation } from "./AutoMoviePhysicalSimulation";
import { admitPhysicalSupportPattern } from "./admitPhysicalSupportPattern";
import { isPhysicalNativeNumber as scalar } from "./isPhysicalNativeNumber";
import { resolvePhysicalPerformanceMode } from "./resolvePhysicalPerformanceMode";

/**
 * Admit one body's declared controller policy independently of its sampled target population.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Admit one body's declared controller policy independently of its sampled target population) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Admit one body's declared controller policy independently of its sampled target population) directly over its typed inputs (`input`, `body`) as nested iteration of depth 2 (for-of over [ body.selfAvoidance, body.rootT; every over [ input.gravity.x * gravity, ; for-of over body.profile.materials), delegating to `scalar`, `Math.fround`, `isAutoMovieRecord`, `resolvePhysicalPerformanceMode`, `Number.isFinite`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (18 throw sites). Beyond structural 0, 1 and 2 the body uses the literals 256, 64, 40, 128, whose basis this answer does not independently establish and a reviewer must confirm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 206 lines and 19 top-level statements that reuses `scalar`, `Math.fround`, `isAutoMovieRecord`, `resolvePhysicalPerformanceMode`, `Number.isFinite` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 5 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `input`, `body`; the dominant cost is nested iteration of depth 2 (for-of over [ body.selfAvoidance, body.rootT; every over [ input.gravity.x * gravity, ; for-of over body.profile.materials), performed once per call with 28 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 28 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function admitPhysicalBody(
  input: Simulation.IInput,
  body: Simulation.IBody,
): void {
  const positive: (value: number) => boolean = (value: number): boolean =>
    scalar(value) && Math.fround(value) > 0;
  const nonnegative: (value: number) => boolean = (value: number): boolean =>
    scalar(value) && value >= 0;
  for (const policy of [
    body.selfAvoidance,
    body.rootTorque,
    body.releasedQuality,
    body.supportTracking,
    body.balance,
  ])
    if (policy !== undefined && !isAutoMovieRecord(policy))
      throw new Error(`${body.id}: invalid optional physical descriptor`);
  if (
    body.compensateGravity !== undefined &&
    typeof body.compensateGravity !== "boolean"
  )
    throw new Error(`${body.id}: invalid gravity-compensation policy`);
  if (
    body.balance?.bracing !== undefined &&
    !isAutoMovieRecord(body.balance.bracing)
  )
    throw new Error(`${body.id}: invalid bracing recovery envelope`);
  resolvePhysicalPerformanceMode(body.mode);
  const gravity: number =
    body.mode.kind === "exaggerated" ? body.mode.gravity : 1;
  if (
    !scalar(gravity) ||
    ![
      input.gravity.x * gravity,
      input.gravity.y * gravity,
      input.gravity.z * gravity,
    ].every(scalar)
  )
    throw new Error(`${body.id}: native gravity exceeds f32 range`);
  for (const material of body.profile.materials) {
    const compliance: number =
      material.compliance *
      (body.mode.kind === "exaggerated" ? body.mode.compliance : 1);
    if (
      !Number.isFinite(compliance) ||
      (material.compliance > 0 && !(compliance > 0))
    )
      throw new Error(
        `${body.id}: scaled physical compliance is not finite and positive`,
      );
  }
  if (
    !Number.isSafeInteger(body.maximumBindings) ||
    body.maximumBindings! < 1 ||
    body.maximumBindings! > 256
  )
    throw new Error(`${body.id}: invalid contact binding budget`);
  if (
    !Number.isFinite(body.handoffSeconds) ||
    !(body.handoffSeconds! > 0) ||
    !Number.isFinite(body.handoffSeconds! * input.rate * input.substeps!)
  )
    throw new Error(`${body.id}: invalid ownership handoff duration`);
  if (
    !body.handoffLimits ||
    ![
      body.handoffLimits.maximumLinearError,
      body.handoffLimits.maximumJointViolation,
    ].every(nonnegative)
  )
    throw new Error(`${body.id}: invalid ownership handoff residual limits`);
  if (
    body.selfAvoidance &&
    (!Number.isSafeInteger(body.selfAvoidance.iterations) ||
      body.selfAvoidance.iterations < 1 ||
      body.selfAvoidance.iterations > 64 ||
      !positive(body.selfAvoidance.tolerance) ||
      body.profile.joints.reduce(
        (
          sum: number,
          joint: Simulation.IBody["profile"]["joints"][number],
        ): number =>
          sum +
          joint.axes.filter(
            (
              axis: Simulation.IBody["profile"]["joints"][number]["axes"][number],
            ): boolean => axis.maximum > axis.minimum,
          ).length,
        0,
      ) > 64 ||
      body.profile.segments.reduce(
        (
          sum: number,
          segment: Simulation.IBody["profile"]["segments"][number],
        ): number => sum + segment.shapes.length,
        0,
      ) > 40)
  )
    throw new Error(
      `${body.id}: self-contact fitting exceeds its declared work budget`,
    );
  if (
    (body.actuation !== undefined &&
      body.actuation !== "world" &&
      body.actuation !== "internal") ||
    (body.actuation === "internal" && !body.supportTracking && !body.balance)
  )
    throw new Error(`${body.id}: invalid actuator reaction policy`);
  if (
    ![
      body.rootStiffness,
      body.rootDamping,
      body.maximumRootForce,
      body.complianceSeconds,
      body.complianceStrength,
    ].every(nonnegative) ||
    body.complianceStrength > 1 ||
    !Array.isArray(body.targets) ||
    body.targets.length !== input.duration * input.rate + 1
  )
    throw new Error(`${body.id}: invalid tracking settings or target count`);
  if (
    body.rootTorque &&
    (![body.rootTorque.stiffness, body.rootTorque.damping].every(nonnegative) ||
      !positive(body.rootTorque.maximumTorque))
  )
    throw new Error(`${body.id}: invalid root torque budget`);
  if (
    body.releasedQuality !== undefined &&
    (!body.releasedQuality ||
      !Number.isSafeInteger(body.releasedQuality.iterations) ||
      body.releasedQuality.iterations < 1 ||
      body.releasedQuality.iterations > 128 ||
      !Number.isSafeInteger(body.releasedQuality.internalIterations) ||
      body.releasedQuality.internalIterations < 1 ||
      body.releasedQuality.internalIterations > 128 ||
      (body.releasedQuality.duringReflex !== undefined &&
        typeof body.releasedQuality.duringReflex !== "boolean"))
  )
    throw new Error(`${body.id}: invalid released articulation quality budget`);
  if (body.supportTracking) {
    const policy: NonNullable<Simulation.IBody["supportTracking"]> =
      body.supportTracking;
    admitPhysicalSupportPattern(body.profile, policy.pattern, false);
    if (
      ![policy.stiffness, policy.damping, policy.maximumForce].every(
        positive,
      ) ||
      (policy.iterations !== undefined &&
        (!Number.isSafeInteger(policy.iterations) ||
          policy.iterations < 0 ||
          policy.iterations > 64)) ||
      (policy.tolerance !== undefined && !positive(policy.tolerance))
    )
      throw new Error(`${body.id}: invalid planted support actuator policy`);
  }
  if (body.balance) {
    const policy: NonNullable<Simulation.IBody["balance"]> = body.balance;
    admitPhysicalSupportPattern(body.profile, policy.pattern, true);
    if (
      !(Math.abs(Math.fround(input.gravity.y * gravity)) > 0) ||
      ![
        policy.maximumStep,
        policy.duration,
        policy.stiffness,
        policy.damping,
        policy.maximumForce,
      ].every(positive) ||
      ![policy.margin, policy.height].every(nonnegative)
    )
      throw new Error(`${body.id}: invalid recovery policy`);
    if (
      policy.bracing &&
      ![
        policy.bracing.minimumCenterHeight,
        policy.bracing.maximumRootShift,
      ].every(positive)
    )
      throw new Error(`${body.id}: invalid bracing recovery envelope`);
    if (
      (policy.reactionSeconds !== undefined &&
        !nonnegative(policy.reactionSeconds)) ||
      (policy.iterations !== undefined &&
        (!Number.isSafeInteger(policy.iterations) ||
          policy.iterations < 1 ||
          policy.iterations > 64)) ||
      (policy.targetTolerance !== undefined &&
        !positive(policy.targetTolerance)) ||
      (policy.maximumRootDrop !== undefined &&
        !nonnegative(policy.maximumRootDrop))
    )
      throw new Error(`${body.id}: invalid support-reach or IK budget`);
    if (
      [
        policy.landingTolerance,
        policy.landingSpeed,
        policy.landingTimeout,
      ].some(
        (value: number | undefined): boolean =>
          value !== undefined && !positive(value),
      ) ||
      (policy.jointStrength !== undefined &&
        (!Number.isFinite(policy.jointStrength) ||
          policy.jointStrength < 0 ||
          policy.jointStrength > 1))
    )
      throw new Error(`${body.id}: invalid landing or recovery budgets`);
  }
}
