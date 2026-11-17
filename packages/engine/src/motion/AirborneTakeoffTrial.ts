import type { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { AirborneShapeHistory } from "./AirborneShapeHistory";
import { AirborneTakeoffJacobian } from "./AirborneTakeoffJacobian";
import { MotionTrajectoryPartition } from "./MotionTrajectoryPartition";
import { integrateAirborneRotation } from "./integrateAirborneRotation";
import type { solveAirborneTakeoff } from "./solveAirborneTakeoff";
import { AirborneTakeoffAngles } from "./AirborneTakeoffAngles";

/**
 * Evaluate shooting points with optional momentum sensitivities. Rejected
 * line-search trials need only the actual physical residual; an improving
 * point is promoted to the full tangent solve before another Newton step.
 * The caller judges the promoted residual again, so a different adaptive
 * mesh cannot turn an unverified improvement into an accepted Newton point.
 *
 * @param props One unchanged physical history, flight and numerical budgets.
 * @param axes Requested turning axes in the takeoff root frame.
 * @param frame Their world orientation at takeoff.
 * @returns Call-local trial, retarget and mesh-release operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States residual-only trials, sensitivity promotion, exact-point reuse, frames and lifetime.
 * @evidence contracts/development/implementation.md#principled-implementation Each residual comes from its actual torque-free physical flight under unchanged budgets. Tangent promotion recomputes that flight with the original sensitivity partition; it is never a guessed Jacobian or a derivative of another mesh. Angle unwrapping retains the original default-step branch convention.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One evaluator selects an exact existing point or integrates the requested physical/tangent system, then retargets the unchanged endpoint.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Neither residual acceptance nor physical error is reused at a nearby momentum. Generic histories retain their original independent meshes and callback errors.
 * @evidence contracts/development/implementation.md#efficient-algorithms Non-improving backtracking trials carry zero tangent states rather than nine. Improving nonterminal trials additionally need one full tangent solve; actual break-even and mesh-retention costs remain unmeasured. Owned-history integrations share exact error-checked time partitions.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Only Object.is-equal momentum components reuse endpoint/flight data from the caller's current and last rejected points; a required Jacobian must actually be present. Factory history provenance permits a call-local time mesh, not shared states or verdicts.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns at most its current and last rejected evaluations and releases the operation mesh in finally. No point map or cross-call cache exists; completed flight playback retains only numeric trajectory data.
 */
export function AirborneTakeoffTrial(
  props: solveAirborneTakeoff.IProps,
  axes: IAutoMovieQuaternion,
  frame: IAutoMovieQuaternion,
): AirborneTakeoffTrial.IOperation {
  const partition: MotionTrajectoryPartition.IPartition | undefined =
    props.integration !== undefined && AirborneShapeHistory.owned(props.history)
      ? MotionTrajectoryPartition(props.t0, props.t1)
      : undefined;
  const directions: IAutoMovieVector3[] = [0, 1, 2].map(
    (i: number): IAutoMovieVector3 => Quaternion.rotateVector(frame, {
      x: i === 0 ? 1 : 0, y: i === 1 ? 1 : 0, z: i === 2 ? 1 : 0,
    }),
  );
  const retarget: AirborneTakeoffTrial.IOperation["retarget"] = (
    point: AirborneTakeoffTrial.IPoint,
    target: readonly number[],
  ): AirborneTakeoffTrial.IPoint => ({
    ...point,
    r: [point.end.somersault - target[0]!, point.end.tilt - target[1]!,
      point.end.twist - target[2]!],
  });
  return {
    retarget,
    clear: (): void => partition?.clear(),
    evaluate: (
      local: readonly number[], target: readonly number[], sensitive: boolean,
      current?: AirborneTakeoffTrial.IPoint, rejected?: AirborneTakeoffTrial.IPoint,
    ): AirborneTakeoffTrial.IPoint => {
      const known: AirborneTakeoffTrial.IPoint | undefined = [current, rejected].find(
        (point: AirborneTakeoffTrial.IPoint | undefined): boolean =>
          point !== undefined && (!sensitive || point.jacobian !== undefined)
          && point.local.length === local.length
          && local.every((v: number, i: number): boolean => Object.is(v, point.local[i])),
      );
      if (known !== undefined) return retarget(known, target);
      const flight: integrateAirborneRotation.IFlight = integrateAirborneRotation({
        history: props.history, t0: props.t0, t1: props.t1, q0: props.q0,
        momentum: Quaternion.rotateVector(frame, { x: local[0]!, y: local[1]!, z: local[2]! }),
        h: props.h, tolerance: props.integration, momentumTolerance: props.momentumTolerance,
        errorScope: props.errorScope, variations: sensitive ? directions : undefined, partition,
      });
      const end: solveAirborneTakeoff.IAngles = AirborneTakeoffAngles.unwrapped({
        ...flight,
        orientation: (seconds: number): IAutoMovieQuaternion =>
          Quaternion.multiply(flight.orientation(seconds), axes),
      }, frame);
      return retarget({
        local: [...local], end, r: [], flight,
        jacobian: sensitive ? AirborneTakeoffJacobian(end, axes, flight.variations(props.t1)) : undefined,
      }, target);
    },
  };
}

/**
 * Physical shooting points and their call-local evaluator.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Point members state momentum coordinates, radian residuals and optional actual integrated Jacobians.
 * @evidence contracts/development/design.md#principled-representation A point owns its physical flight, endpoint angles and numeric momentum; an absent Jacobian explicitly means no sensitivities were integrated.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The takeoff solver alone constructs this operation and consumes its point, retarget and release surface.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The optional Jacobian distinguishes a real derivative from a residual-only trial without a trusted success flag or duplicate body model.
 */
export namespace AirborneTakeoffTrial {
  /**
   * A physical trial at takeoff-frame momentum components, kg m squared per second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states physical momentum, actual radian endpoint/residual, derivative availability and completed-flight ownership.
   * @evidence contracts/development/design.md#principled-representation An actual solved trajectory accompanies every endpoint and residual; a missing Jacobian explicitly represents a residual-only evaluation.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The Newton and continuation owners consume exactly these numeric results and the original completed flight.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the existing angle and flight contracts without a second physical state, synthetic derivative or success flag.
   */
  export interface IPoint {
    /** Fresh local momentum coordinates. */
    local: number[];
    /** Actual unwrapped endpoint in radians. */
    end: solveAirborneTakeoff.IAngles;
    /** Endpoint minus the current full stage target, radians. */
    r: number[];
    /** Actual integrated angle derivatives, absent on a residual-only trial. */
    jacobian: number[][] | undefined;
    /** The actual numeric flight whose endpoint and residual were observed. */
    flight: integrateAirborneRotation.IFlight;
  }

  /**
   * Trial evaluation and exact-point reuse within one unchanged solve.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines actual optional-sensitivity evaluation, pure retargeting and operation release.
   * @evidence contracts/development/design.md#principled-representation One evaluator owns one fixed physical history epoch; it cannot accept a trajectory on the solver's behalf.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Newton uses evaluate, continuation reuses retarget, and the takeoff operation calls clear in finally.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Candidate reuse requires current exact numeric momentum and actual derivative availability, without a public trusted-cache flag.
   */
  export interface IOperation {
    /** Integrate only the requested physical/tangent system, or reuse an exactly equal point having the required data. */
    evaluate(local: readonly number[], target: readonly number[], sensitive: boolean,
      current?: IPoint, rejected?: IPoint): IPoint;
    /** Change only the target subtracted from an unchanged physical endpoint. */
    retarget(point: IPoint, target: readonly number[]): IPoint;
    /** Release any operation-owned temporal partition on success or failure. */
    clear(): void;
  }
}
