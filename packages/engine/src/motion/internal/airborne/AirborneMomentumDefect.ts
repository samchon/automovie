import type {
  IAutoMovieIntegrateAirborneRotation,
  IAutoMovieIntegrateMotionTrajectory,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../../../math/Quaternion";
import type { physicalInertiaFactor } from "../../../physics/internal/physicalInertiaFactor";
import { AirborneShapeHistory } from "./AirborneShapeHistory";
import { AirborneTabulatedShapeHistory } from "./AirborneTabulatedShapeHistory";
import type { MotionTrajectoryFailure } from "../../MotionTrajectoryFailure";

/** Relative angular-momentum share and absolute kg m²/s budget. */
type MomentumTolerance = Pick<
  IAutoMovieIntegrateMotionTrajectory.ITolerance,
  "relative" | "absolute"
>;

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
 * @param tolerance Relative momentum share and absolute kg m²/s budget, finite
 *   and nonnegative with at least one positive.
 * @returns A pure reader of seconds, unit world orientation and dense body
 *   angular velocity in rad/s, returning the normalized defect; zero budget
 *   admits only exactly zero defect.
 * @throws {Error} For invalid budgets, nonfinite physical inputs, nonpositive
 *   principal moments or unrepresentable reconstructed momentum.
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
  if (!(relative >= 0 && absolute >= 0 && relative + absolute > 0))
    throw new Error(
      "Airborne momentum needs a finite nonnegative physical error budget",
    );
  const target: IAutoMovieVector3 = {
    x: momentum.x,
    y: momentum.y,
    z: momentum.z,
  };
  const scale: number = physicalScale(target, relative, absolute);

  // A tabulated history reads a new second's numbers and factorisation
  // without issuing an instant; any other history issues its instant.
  const reading: (
    seconds: number,
  ) =>
    | AirborneTabulatedShapeHistory.IReading
    | IAutoMovieIntegrateAirborneRotation.IInstant =
    AirborneTabulatedShapeHistory.reading(history) ?? history;
  return (
    seconds: number,
    orientation: IAutoMovieQuaternion,
    angularVelocity: IAutoMovieVector3,
  ): number => {
    const read:
      | AirborneTabulatedShapeHistory.IReading
      | IAutoMovieIntegrateAirborneRotation.IInstant = reading(seconds);
    const instant: IAutoMovieIntegrateAirborneRotation.IInstant | undefined =
      "factor" in read ? undefined : read;
    const factor: physicalInertiaFactor.IPrepared | undefined =
      "factor" in read ? read.factor : AirborneShapeHistory.factor(read);

    let body: IAutoMovieVector3;
    if (factor !== undefined) body = factor.apply(angularVelocity);
    else {
      // Only an instant leaves the factorisation undefined.
      const {
        moments,
        rotation,
      }: IAutoMovieIntegrateAirborneRotation.IInstant["inertia"] =
        instant!.inertia;
      if (!(moments.x > 0 && moments.y > 0 && moments.z > 0))
        throw new Error(
          "Airborne momentum defect needs positive principal moments",
        );
      const local: IAutoMovieVector3 = Quaternion.rotateVector(
        AirborneShapeHistory.inverse(instant!) ?? Quaternion.inverse(rotation),
        angularVelocity,
      );
      local.x *= moments.x;
      local.y *= moments.y;
      local.z *= moments.z;
      body = Quaternion.rotateVector(rotation, local);
    }
    body.x += read.relative.x;
    body.y += read.relative.y;
    body.z += read.relative.z;
    const world: IAutoMovieVector3 = Quaternion.rotateVector(orientation, body);
    const error: number = Math.hypot(
      world.x - target.x,
      world.y - target.y,
      world.z - target.z,
    );
    return scale === 0 ? (error === 0 ? 0 : Infinity) : error / scale;
  };
}

/** Physical context added to the trajectory owner's numeric failure. */
export namespace AirborneMomentumDefect {
  /** Owned scalar snapshots of one unresolved integration, without raw bones. */
  export interface IFailureContext {
    /** Requested world L, x/y/z, kg m²/s. */
    targetMomentum: [number, number, number];

    /**
     * Relative share and absolute kg m²/s, or null when physical control was
     * disabled.
     */
    momentumBudget: [number, number] | null;

    /**
     * The exact numeric absolute-plus-relative scale used by the metric, kg
     * m²/s.
     */
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

    /**
     * Principal-to-root quaternion x/y/z/w at the same probe, or null when
     * unavailable.
     */
    principalRotation: [number, number, number, number] | null;

    /**
     * Relative shape momentum in root axes, x/y/z, kg m²/s, or null when
     * unavailable.
     */
    relativeMomentum: [number, number, number] | null;

    /**
     * The failed dense root-to-world quaternion x/y/z/w, or null without a
     * physical probe.
     */
    denseOrientation: [number, number, number, number] | null;

    /**
     * The failed dense body angular velocity x/y/z, rad/s, or null without a
     * physical probe.
     */
    denseBodyRate: [number, number, number] | null;

    /**
     * A secondary failed-probe history problem, preserving the original
     * failure.
     */
    historyError: string | null;
  }

  /**
   * Add bounded physical snapshots to the same owned, extensible trajectory
   * error. Flat numeric tuples remain visible to ordinary error inspection. The
   * message also carries the complete numeric context when a reporter truncates
   * nested properties. Error identity, stack and rejection survive. Read the
   * unresolved interval's start, rejected endpoint and failed physical probe;
   * the pure history shares cached instants, and secondary failures are
   * recorded. Neither the original rejection nor any successful numerical path
   * changes.
   */
  export function failure(
    error: MotionTrajectoryFailure,
    history: IAutoMovieIntegrateAirborneRotation.IHistory,
    momentum: IAutoMovieVector3,
    tolerance: MomentumTolerance | undefined,
  ): MotionTrajectoryFailure & IFailureContext {
    const startRate: NonNullable<
      MotionTrajectoryFailure["rejection"]
    >["start"] = error.rejection?.start;
    const endRate: NonNullable<MotionTrajectoryFailure["rejection"]>["end"] =
      error.rejection?.end;
    const probe: NonNullable<MotionTrajectoryFailure["rejection"]>["probe"] =
      error.rejection?.probe;
    const trialEnd: number | null =
      error.rejection === undefined ? null : error.time + error.rejection.step;
    const target: IAutoMovieVector3 = {
      x: momentum.x,
      y: momentum.y,
      z: momentum.z,
    };
    const budget: MomentumTolerance | undefined =
      tolerance === undefined
        ? undefined
        : { relative: tolerance.relative, absolute: tolerance.absolute };
    const context: IFailureContext = {
      targetMomentum: [target.x, target.y, target.z],
      momentumBudget:
        budget === undefined ? null : [budget.relative, budget.absolute],
      momentumScale:
        budget === undefined
          ? null
          : physicalScale(target, budget.relative, budget.absolute),
      startPrincipalMoments: null,
      startPrincipalRotation: null,
      startRelativeMomentum: null,
      startHistoryError: null,
      startOrientation:
        startRate === undefined
          ? null
          : [startRate.q.x, startRate.q.y, startRate.q.z, startRate.q.w],
      startBodyRate:
        startRate === undefined
          ? null
          : [startRate.w.x, startRate.w.y, startRate.w.z],
      trialEndTime: trialEnd,
      endPrincipalMoments: null,
      endPrincipalRotation: null,
      endRelativeMomentum: null,
      endHistoryError: null,
      endOrientation:
        endRate === undefined
          ? null
          : [endRate.q.x, endRate.q.y, endRate.q.z, endRate.q.w],
      endBodyRate:
        endRate === undefined ? null : [endRate.w.x, endRate.w.y, endRate.w.z],
      failedProbeTime: probe?.time ?? null,
      principalMoments: null,
      principalRotation: null,
      relativeMomentum: null,
      denseOrientation:
        probe === undefined
          ? null
          : [probe.q.x, probe.q.y, probe.q.z, probe.q.w],
      denseBodyRate:
        probe === undefined ? null : [probe.w.x, probe.w.y, probe.w.z],
      historyError: null,
    };
    try {
      const start: IAutoMovieIntegrateAirborneRotation.IInstant = history(
        error.time,
      );
      const { moments, rotation }: typeof start.inertia = start.inertia;
      context.startPrincipalMoments = [moments.x, moments.y, moments.z];
      context.startPrincipalRotation = [
        rotation.x,
        rotation.y,
        rotation.z,
        rotation.w,
      ];
      context.startRelativeMomentum = [
        start.relative.x,
        start.relative.y,
        start.relative.z,
      ];
    } catch (problem) {
      context.startHistoryError =
        problem instanceof Error
          ? problem.message
          : "History query threw a non-Error value";
    }
    if (trialEnd !== null) {
      try {
        const end: IAutoMovieIntegrateAirborneRotation.IInstant =
          history(trialEnd);
        const { moments, rotation }: typeof end.inertia = end.inertia;
        context.endPrincipalMoments = [moments.x, moments.y, moments.z];
        context.endPrincipalRotation = [
          rotation.x,
          rotation.y,
          rotation.z,
          rotation.w,
        ];
        context.endRelativeMomentum = [
          end.relative.x,
          end.relative.y,
          end.relative.z,
        ];
      } catch (problem) {
        context.endHistoryError =
          problem instanceof Error
            ? problem.message
            : "History query threw a non-Error value";
      }
    }
    if (probe !== undefined) {
      try {
        const instant: IAutoMovieIntegrateAirborneRotation.IInstant = history(
          probe.time,
        );
        const { moments, rotation }: typeof instant.inertia = instant.inertia;
        context.principalMoments = [moments.x, moments.y, moments.z];
        context.principalRotation = [
          rotation.x,
          rotation.y,
          rotation.z,
          rotation.w,
        ];
        context.relativeMomentum = [
          instant.relative.x,
          instant.relative.y,
          instant.relative.z,
        ];
      } catch (problem) {
        context.historyError =
          problem instanceof Error
            ? problem.message
            : "History query threw a non-Error value";
      }
    }
    error.message += `; airborne ${JSON.stringify(context)}`;
    return Object.assign(error, context);
  }
}

/**
 * Scale vector components before the norm so a small share can keep a large
 * finite target representable.
 */
function physicalScale(
  momentum: IAutoMovieVector3,
  relative: number,
  absolute: number,
): number {
  return (
    absolute +
    Math.hypot(
      relative * momentum.x,
      relative * momentum.y,
      relative * momentum.z,
    )
  );
}
