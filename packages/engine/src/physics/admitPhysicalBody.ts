import type { IAutoMoviePhysicalSimulationInput } from "@automovie/interface";

import { admitPhysicalSupportPattern } from "./admitPhysicalSupportPattern";
import { resolvePhysicalPerformanceMode } from "./resolvePhysicalPerformanceMode";

/**
 * Admit one body's declared controller policy independently of its sampled
 * target population.
 */
export function admitPhysicalBody(
  input: IAutoMoviePhysicalSimulationInput.IInput,
  body: IAutoMoviePhysicalSimulationInput.IBody,
): void {
  const positive: (value: number) => boolean = (value: number): boolean =>
    value > 0;
  const nonnegative: (value: number) => boolean = (value: number): boolean =>
    value >= 0;
  resolvePhysicalPerformanceMode(body.mode);
  const gravity: number =
    body.mode.kind === "exaggerated" ? body.mode.gravity : 1;
  for (const material of body.profile.materials) {
    const compliance: number =
      material.compliance *
      (body.mode.kind === "exaggerated" ? body.mode.compliance : 1);
    if (material.compliance > 0 && compliance <= 0)
      throw new Error(`${body.id}: scaled physical compliance is not positive`);
  }
  if (body.maximumBindings! < 1 || body.maximumBindings! > 256)
    throw new Error(`${body.id}: invalid contact binding budget`);
  if (body.handoffSeconds! <= 0)
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
    (body.selfAvoidance.iterations < 1 ||
      body.selfAvoidance.iterations > 64 ||
      !positive(body.selfAvoidance.tolerance) ||
      body.profile.joints.reduce(
        (
          sum: number,
          joint: IAutoMoviePhysicalSimulationInput.IBody["profile"]["joints"][number],
        ): number =>
          sum +
          joint.axes.filter(
            (
              axis: IAutoMoviePhysicalSimulationInput.IBody["profile"]["joints"][number]["axes"][number],
            ): boolean => axis.maximum > axis.minimum,
          ).length,
        0,
      ) > 64 ||
      body.profile.segments.reduce(
        (
          sum: number,
          segment: IAutoMoviePhysicalSimulationInput.IBody["profile"]["segments"][number],
        ): number => sum + segment.shapes.length,
        0,
      ) > 40)
  )
    throw new Error(
      `${body.id}: self-contact fitting exceeds its declared work budget`,
    );
  if (body.actuation === "internal" && !body.supportTracking && !body.balance)
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
    body.targets.length !== Math.round(input.duration * input.rate) + 1
  )
    throw new Error(`${body.id}: invalid tracking settings or target count`);
  if (
    body.rootTorque &&
    (![body.rootTorque.stiffness, body.rootTorque.damping].every(nonnegative) ||
      !positive(body.rootTorque.maximumTorque))
  )
    throw new Error(`${body.id}: invalid root torque budget`);

  if (body.supportTracking) {
    const policy: NonNullable<
      IAutoMoviePhysicalSimulationInput.IBody["supportTracking"]
    > = body.supportTracking;
    admitPhysicalSupportPattern(body.profile, policy.pattern, false);
    if (
      ![policy.stiffness, policy.damping, policy.maximumForce].every(
        positive,
      ) ||
      (policy.iterations !== undefined &&
        (policy.iterations < 0 || policy.iterations > 64)) ||
      (policy.tolerance !== undefined && !positive(policy.tolerance))
    )
      throw new Error(`${body.id}: invalid planted support actuator policy`);
  }
  if (body.balance) {
    const policy: NonNullable<
      IAutoMoviePhysicalSimulationInput.IBody["balance"]
    > = body.balance;
    admitPhysicalSupportPattern(body.profile, policy.pattern, true);
    if (
      !(Math.abs(input.gravity.y * gravity) > 0) ||
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
        (policy.iterations < 1 || policy.iterations > 64)) ||
      (policy.targetTolerance !== undefined &&
        !positive(policy.targetTolerance)) ||
      (policy.maximumRootDrop !== undefined &&
        !nonnegative(policy.maximumRootDrop))
    )
      throw new Error(`${body.id}: invalid support-reach or IK budget`);
    if (
      [policy.landingTimeout].some(
        (value: number | undefined): boolean =>
          value !== undefined && !positive(value),
      ) ||
      (policy.jointStrength !== undefined &&
        (policy.jointStrength < 0 || policy.jointStrength > 1))
    )
      throw new Error(`${body.id}: invalid landing or recovery budgets`);
  }
}
