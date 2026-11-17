import type {
  IAutoMovieIntegrateAirborneRotation,
  IAutoMovieIntegrateMotionTrajectory,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import type { physicalInertiaFactor } from "../physics/physicalInertiaFactor";
import { AirborneShapeHistory } from "./AirborneShapeHistory";
import type { MotionTrajectoryFailure } from "./MotionTrajectoryFailure";

/** Relative angular-momentum share and absolute kg m²/s budget. */
type MomentumTolerance = Pick<IAutoMovieIntegrateMotionTrajectory.ITolerance, "relative" | "absolute">;

/**
 * Measure a dense flight's angular-momentum defect in the actual mass model.
 *
 * The reconstructed world momentum is R (I omega + h), using the same
 * root-frame principal inertia and relative momentum as the flight ODE.
 * Comparing it directly with the requested world momentum retains inertia
 * anisotropy and cancellation between root and segment motion. An angular
 * rate's relative error alone does not bound this physical error.
 *
 * @param history The pure root-frame shape history of this integration.
 * @param momentum Its unchanged world angular momentum, kg m²/s.
 * @param tolerance Relative momentum share and absolute kg m²/s budget, finite and nonnegative with at least one positive.
 * @returns A pure reader of seconds, unit world orientation and dense body angular velocity in rad/s, returning the normalized defect; zero budget admits only exactly zero defect.
 * @throws {Error} For invalid budgets, nonfinite physical inputs, nonpositive principal moments or unrepresentable reconstructed momentum.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the conserved quantity, root/world frames, SI rate and momentum units, explicit physical budget, zero-scale rule and finite-arithmetic refusal.
 * @evidence contracts/development/implementation.md#principled-implementation Evaluates R(I omega+h) and compares it with L in world coordinates. Unobserved factory tensors supply their admitted SPD operator directly; foreign or publicly observed principals retain Q diag(I) Q^T. Unit frames and a pure history are premises; finite components and positive principal moments are admitted on the public path. The metric retains actual tensor conditioning and relative-motion cancellation.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit and snapshot the integration's fixed target and physical budget, then reconstruct one queried momentum and return its scaled Euclidean error.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No rate, inertia or momentum is clamped or repaired. A zero physical scale requires exact agreement and has no invented absolute floor. A sampled dense defect does not certify every intermediate time or the separate finite-difference observation stencil.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each measurement makes one history query plus a fixed-size tensor product and world rotation. A valid factory operator avoids principal materialization and its two rotations; the public path retains them. No perturbed integration or sampled pose is retained here; no wall-time improvement is yet measured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One integration copies target components and admits its relative/absolute budget once; those same captured scalars drive the component-scaled norm without rereading the caller's budget. Each time reads its actual history instant. Engine histories share exact principal inverses under copied quaternion keys; general histories retain their original inverse path, and changed physical inputs require a new integration.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned integration-scoped callback holds its history, copied target and one scalar budget until the integrator releases it. Each query's vectors are temporary and no query population, body identity cache or external resource is owned here.
 */
export function AirborneMomentumDefect(
  history: IAutoMovieIntegrateAirborneRotation.IHistory,
  momentum: IAutoMovieVector3,
  tolerance: MomentumTolerance,
): (
  seconds: number,
  orientation: IAutoMovieQuaternion,
  angularVelocity: IAutoMovieVector3,
) => number {
  const { relative, absolute }: typeof tolerance = tolerance;
  if (
    !(
      Number.isFinite(relative) &&
      relative >= 0 &&
      Number.isFinite(absolute) &&
      absolute >= 0 &&
      relative + absolute > 0
    )
  )
    throw new Error(
      "Airborne momentum needs a finite nonnegative physical error budget",
    );
  const target: IAutoMovieVector3 = {
    x: momentum.x,
    y: momentum.y,
    z: momentum.z,
  };
  if (!finiteVector(target))
    throw new Error("Airborne momentum needs finite world components");
  const scale: number = physicalScale(target, relative, absolute);
  if (!Number.isFinite(scale))
    throw new Error("Airborne momentum error budget exceeds finite arithmetic");

  return (
    seconds: number,
    orientation: IAutoMovieQuaternion,
    angularVelocity: IAutoMovieVector3,
  ): number => {
    const instant: IAutoMovieIntegrateAirborneRotation.IInstant = history(seconds);
    const factor: physicalInertiaFactor.IPrepared | undefined = AirborneShapeHistory.factor(instant);
    if (
      !(
        finiteVector(instant.relative) &&
        finiteVector(angularVelocity) &&
        finiteQuaternion(orientation)
      )
    )
      throw new Error(
        "Airborne momentum defect needs finite physical data and positive principal moments",
      );
    let body: IAutoMovieVector3;
    if (factor !== undefined) body = factor.apply(angularVelocity);
    else {
      const { moments, rotation }: typeof instant.inertia = instant.inertia;
      if (!(finiteVector(moments) && moments.x > 0 && moments.y > 0 && moments.z > 0 && finiteQuaternion(rotation)))
        throw new Error("Airborne momentum defect needs finite physical data and positive principal moments");
      const local: IAutoMovieVector3 = Quaternion.rotateVector(
        AirborneShapeHistory.inverse(instant) ?? Quaternion.inverse(rotation), angularVelocity,
      );
      local.x *= moments.x;
      local.y *= moments.y;
      local.z *= moments.z;
      body = Quaternion.rotateVector(rotation, local);
    }
    body.x += instant.relative.x;
    body.y += instant.relative.y;
    body.z += instant.relative.z;
    const world: IAutoMovieVector3 = Quaternion.rotateVector(orientation, body);
    const error: number = Math.hypot(
      world.x - target.x,
      world.y - target.y,
      world.z - target.z,
    );
    if (!Number.isFinite(error))
      throw new Error(
        "Airborne reconstructed momentum exceeds finite arithmetic",
      );
    return scale === 0 ? (error === 0 ? 0 : Infinity) : error / scale;
  };
}

/**
 * Physical context added to the trajectory owner's numeric failure.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The context documents tuple order, SI units, disabled budgets and unavailable failed probes; failure preserves the original typed error and any secondary history problem.
 * @evidence contracts/development/design.md#principled-representation Fixed numeric tuples describe the same world target, dense body rate and root-frame inertia/relative momentum as the physical defect without retaining a model or callback.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The airborne wrapper consumes failure only after MotionTrajectoryFailure, allowing the ordinary error reporter to expose the actual physical target and matching failed-probe history.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This diagnostic surface neither changes error admission nor replaces a foreign error, callback or result; failed history observation is recorded while the original failure escapes.
 */
export namespace AirborneMomentumDefect {
  /** Owned scalar snapshots of one unresolved integration, without raw bones. */
  export interface IFailureContext {
    /** Requested world L, x/y/z, kg m²/s. */
    targetMomentum: [number, number, number];

    /** Relative share and absolute kg m²/s, or null when physical control was disabled. */
    momentumBudget: [number, number] | null;

    /** The exact numeric absolute-plus-relative scale used by the metric, kg m²/s. */
    momentumScale: number | null;

    /** Principal moments at the unresolved interval's start, x/y/z, kg m². */
    startPrincipalMoments: [number, number, number] | null;

    /** Principal-to-root quaternion x/y/z/w at that same start. */
    startPrincipalRotation: [number, number, number, number] | null;

    /** Relative shape momentum at that start, x/y/z, kg m²/s. */
    startRelativeMomentum: [number, number, number] | null;

    /** A secondary start-history problem, preserving the original failure. */
    startHistoryError: string | null;

    /** Actual first-stage RHS quaternion x/y/z/w, before any knot normalization. */
    startOrientation: [number, number, number, number] | null;

    /** Its body angular velocity x/y/z, rad/s. */
    startBodyRate: [number, number, number] | null;

    /** Endpoint of the last rejected trial, seconds, or null before a rejection. */
    trialEndTime: number | null;

    /** Principal moments at that endpoint, x/y/z, kg m². */
    endPrincipalMoments: [number, number, number] | null;

    /** Principal-to-root quaternion x/y/z/w at that endpoint. */
    endPrincipalRotation: [number, number, number, number] | null;

    /** Relative shape momentum at that endpoint, x/y/z, kg m²/s. */
    endRelativeMomentum: [number, number, number] | null;

    /** A secondary endpoint-history problem, preserving the original failure. */
    endHistoryError: string | null;

    /** Actual final-stage RHS quaternion x/y/z/w, before knot normalization. */
    endOrientation: [number, number, number, number] | null;

    /** Its body angular velocity x/y/z, rad/s. */
    endBodyRate: [number, number, number] | null;

    /** Actual failed physical probe time, seconds, or null without one. */
    failedProbeTime: number | null;

    /** Principal moments at that probe, x/y/z, kg m², or null when unavailable. */
    principalMoments: [number, number, number] | null;

    /** Principal-to-root quaternion x/y/z/w at the same probe, or null when unavailable. */
    principalRotation: [number, number, number, number] | null;

    /** Relative shape momentum in root axes, x/y/z, kg m²/s, or null when unavailable. */
    relativeMomentum: [number, number, number] | null;

    /** The failed dense root-to-world quaternion x/y/z/w, or null without a physical probe. */
    denseOrientation: [number, number, number, number] | null;

    /** The failed dense body angular velocity x/y/z, rad/s, or null without a physical probe. */
    denseBodyRate: [number, number, number] | null;

    /** A secondary failed-probe history problem, preserving the original failure. */
    historyError: string | null;
  }

  /**
   * Add bounded physical snapshots to the same owned, extensible trajectory
   * error. Flat numeric tuples remain visible to ordinary error inspection.
   * The message also carries the complete numeric context when a reporter
   * truncates nested properties. Error identity, stack and rejection survive.
   * Read the unresolved interval's start, rejected endpoint and failed physical
   * probe; the pure history shares cached instants, and secondary failures are recorded.
   * Neither the original rejection nor any successful numerical path changes.
   */
  export function failure(
    error: MotionTrajectoryFailure,
    history: IAutoMovieIntegrateAirborneRotation.IHistory,
    momentum: IAutoMovieVector3,
    tolerance: MomentumTolerance | undefined,
  ): MotionTrajectoryFailure & IFailureContext {
    const startRate: NonNullable<MotionTrajectoryFailure["rejection"]>["start"] = error.rejection?.start;
    const endRate: NonNullable<MotionTrajectoryFailure["rejection"]>["end"] = error.rejection?.end;
    const probe: NonNullable<MotionTrajectoryFailure["rejection"]>["probe"] = error.rejection?.probe;
    const trialEnd: number | null = error.rejection === undefined
      ? null : error.time + error.rejection.step;
    const target: IAutoMovieVector3 = { x: momentum.x, y: momentum.y, z: momentum.z };
    const budget: MomentumTolerance | undefined = tolerance === undefined ? undefined
      : { relative: tolerance.relative, absolute: tolerance.absolute };
    const context: IFailureContext = {
      targetMomentum: [target.x, target.y, target.z],
      momentumBudget: budget === undefined ? null : [budget.relative, budget.absolute],
      momentumScale: budget === undefined ? null : physicalScale(target, budget.relative, budget.absolute),
      startPrincipalMoments: null,
      startPrincipalRotation: null,
      startRelativeMomentum: null,
      startHistoryError: null,
      startOrientation: startRate === undefined ? null : [startRate.q.x, startRate.q.y, startRate.q.z, startRate.q.w],
      startBodyRate: startRate === undefined ? null : [startRate.w.x, startRate.w.y, startRate.w.z],
      trialEndTime: trialEnd,
      endPrincipalMoments: null,
      endPrincipalRotation: null,
      endRelativeMomentum: null,
      endHistoryError: null,
      endOrientation: endRate === undefined ? null : [endRate.q.x, endRate.q.y, endRate.q.z, endRate.q.w],
      endBodyRate: endRate === undefined ? null : [endRate.w.x, endRate.w.y, endRate.w.z],
      failedProbeTime: probe?.time ?? null,
      principalMoments: null,
      principalRotation: null,
      relativeMomentum: null,
      denseOrientation: probe === undefined ? null : [probe.q.x, probe.q.y, probe.q.z, probe.q.w],
      denseBodyRate: probe === undefined ? null : [probe.w.x, probe.w.y, probe.w.z],
      historyError: null,
    };
    try {
      const start: IAutoMovieIntegrateAirborneRotation.IInstant = history(error.time);
      const { moments, rotation }: typeof start.inertia = start.inertia;
      context.startPrincipalMoments = [moments.x, moments.y, moments.z];
      context.startPrincipalRotation = [rotation.x, rotation.y, rotation.z, rotation.w];
      context.startRelativeMomentum = [start.relative.x, start.relative.y, start.relative.z];
    } catch (problem) {
      context.startHistoryError = problem instanceof Error ? problem.message : "History query threw a non-Error value";
    }
    if (trialEnd !== null) {
      try {
        const end: IAutoMovieIntegrateAirborneRotation.IInstant = history(trialEnd);
        const { moments, rotation }: typeof end.inertia = end.inertia;
        context.endPrincipalMoments = [moments.x, moments.y, moments.z];
        context.endPrincipalRotation = [rotation.x, rotation.y, rotation.z, rotation.w];
        context.endRelativeMomentum = [end.relative.x, end.relative.y, end.relative.z];
      } catch (problem) {
        context.endHistoryError = problem instanceof Error ? problem.message : "History query threw a non-Error value";
      }
    }
    if (probe !== undefined) {
      try {
        const instant: IAutoMovieIntegrateAirborneRotation.IInstant = history(probe.time);
        const { moments, rotation }: typeof instant.inertia = instant.inertia;
        context.principalMoments = [moments.x, moments.y, moments.z];
        context.principalRotation = [rotation.x, rotation.y, rotation.z, rotation.w];
        context.relativeMomentum = [instant.relative.x, instant.relative.y, instant.relative.z];
      } catch (problem) {
        context.historyError = problem instanceof Error ? problem.message : "History query threw a non-Error value";
      }
    }
    error.message += `; airborne ${JSON.stringify(context)}`;
    return Object.assign(error, context);
  }
}

/** Scale vector components before the norm so a small share can keep a large finite target representable. */
function physicalScale(momentum: IAutoMovieVector3, relative: number, absolute: number): number {
  return absolute + Math.hypot(
    relative * momentum.x,
    relative * momentum.y,
    relative * momentum.z,
  );
}

/** Admit the current three scalar components without retaining their record. */
function finiteVector(vector: IAutoMovieVector3): boolean {
  return (
    Number.isFinite(vector.x) &&
    Number.isFinite(vector.y) &&
    Number.isFinite(vector.z)
  );
}

/** Unit length remains the frame contract; finite coordinates are admitted here. */
function finiteQuaternion(rotation: IAutoMovieQuaternion): boolean {
  return finiteVector(rotation) && Number.isFinite(rotation.w);
}
