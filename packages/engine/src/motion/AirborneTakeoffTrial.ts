import type {
  IAutoMovieIntegrateAirborneRotation,
  IAutoMovieQuaternion,
  IAutoMovieSolveAirborneTakeoff,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { AirborneShapeHistory } from "./AirborneShapeHistory";
import { AirborneTakeoffAngles } from "./AirborneTakeoffAngles";
import { AirborneTakeoffJacobian } from "./AirborneTakeoffJacobian";
import { MotionTrajectoryPartition } from "./MotionTrajectoryPartition";
import { integrateAirborneRotation } from "./integrateAirborneRotation";

/**
 * Evaluate shooting points with optional momentum sensitivities. A search
 * point is integrated under the embedded error estimate alone (the
 * integration tolerance); the sampled dense momentum control, which
 * certifies the momentum a displayed flight carries, is paid only by the
 * judged evaluation of the solution (`judged`), the one flight that is
 * played back and refused or accepted.
 *
 * @param props One unchanged physical history, flight and numerical budgets.
 * @param axes Requested turning axes in the takeoff root frame.
 * @param frame Their world orientation at takeoff.
 * @returns Call-local trial, retarget and mesh-release operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States search points under the embedded estimate, the judged evaluation under the momentum control, exact-point reuse, frames and lifetime.
 * @evidence contracts/development/implementation.md#principled-implementation Each residual comes from its actual torque-free flight under the integration tolerance; the judged one also under the momentum budget. A Jacobian is the integrated sensitivity of that same flight, never a guessed one or a derivative of another mesh. Angle unwrapping retains the original default-step branch convention.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One evaluator selects an exact existing point or integrates the requested physical/tangent system, then retargets the unchanged endpoint.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Neither residual acceptance nor physical error is reused at a nearby momentum, and a judged evaluation never reuses a search point. Generic histories retain their original independent meshes and callback errors.
 * @evidence contracts/development/implementation.md#efficient-algorithms Search points skip the dense momentum probes (four right-hand sides and the probe roots a step); only the judged solution pays them, once. Owned-history integrations share exact error-checked time partitions.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Only Object.is-equal momentum components reuse endpoint/flight data from the caller's current and last rejected points; a required Jacobian must actually be present. Factory history provenance permits a call-local time mesh, not shared states or verdicts.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns at most its current and last rejected evaluations and releases the operation mesh in finally. No point map or cross-call cache exists; completed flight playback retains only numeric trajectory data.
 */
export function AirborneTakeoffTrial(
  props: IAutoMovieSolveAirborneTakeoff.IProps,
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
      current?: AirborneTakeoffTrial.IPoint, rejected?: AirborneTakeoffTrial.IPoint, judged?: boolean,
    ): AirborneTakeoffTrial.IPoint => {
      const known: AirborneTakeoffTrial.IPoint | undefined = [current, rejected].find(
        (point: AirborneTakeoffTrial.IPoint | undefined): boolean =>
          judged !== true && point !== undefined && (!sensitive || point.jacobian !== undefined)
          && point.local.length === local.length
          && local.every((v: number, i: number): boolean => Object.is(v, point.local[i])),
      );
      if (known !== undefined) return retarget(known, target);
      const flight: IAutoMovieIntegrateAirborneRotation.IFlight = integrateAirborneRotation({
        history: props.history, t0: props.t0, t1: props.t1, q0: props.q0,
        momentum: Quaternion.rotateVector(frame, { x: local[0]!, y: local[1]!, z: local[2]! }),
        h: props.h, tolerance: props.integration,
        momentumTolerance: judged === true ? props.momentumTolerance : undefined,
        errorScope: props.errorScope, variations: sensitive ? directions : undefined, partition,
      });
      const end: IAutoMovieSolveAirborneTakeoff.IAngles = AirborneTakeoffAngles.unwrapped({
        ...flight,
        orientation: (seconds: number): IAutoMovieQuaternion =>
          Quaternion.multiply(flight.orientation(seconds), axes),
      }, frame);
      return retarget({
        local: [...local], end, r: [], flight,
        // Only Newton consumes angle derivatives. The judged flight still
        // carries the integrated momentum sensitivities for public playback.
        jacobian: sensitive && judged !== true
          ? AirborneTakeoffJacobian(end, axes, flight.variations(props.t1))
          : undefined,
      }, target);
    },
  };
}

/**
 * Physical shooting points and their call-local evaluator.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Point members state momentum coordinates, radian residuals and optional actual integrated Jacobians. Companion IPoint: Each member states physical momentum, actual radian endpoint/residual, derivative availability and completed-flight ownership. Companion IOperation: Defines actual optional-sensitivity evaluation, pure retargeting and operation release.
 * @evidence contracts/development/design.md#principled-representation A point owns its physical flight, endpoint angles and numeric momentum; a search point requiring angle derivatives also owns its Jacobian. Companion IPoint: An actual solved trajectory accompanies every endpoint and residual, including the judged flight with its public momentum sensitivities. Companion IOperation: One evaluator owns one fixed physical history epoch; it cannot accept a trajectory on the solver's behalf.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The takeoff solver alone constructs this operation and consumes its point, retarget and release surface. Companion IPoint: The Newton and continuation owners consume exactly these numeric results and the original completed flight. Companion IOperation: Newton uses evaluate, continuation reuses retarget, and the takeoff operation calls clear in finally.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The optional Jacobian records derivatives computed for Newton without a trusted success flag or duplicate body model. Companion IPoint: Reuses the existing angle and flight contracts without a second physical state, synthetic derivative or success flag. Companion IOperation: Candidate reuse requires current exact numeric momentum and actual derivative availability, without a public trusted-cache flag.
 */
export namespace AirborneTakeoffTrial {
  /**
   * A physical trial at takeoff-frame momentum components, kg m squared per second.
   *
   * Each member states physical momentum, actual radian endpoint/residual, derivative availability and completed-flight ownership.
   * An actual solved trajectory accompanies every endpoint and residual. Only a search point requiring angle derivatives materializes its Jacobian.
   * The Newton and continuation owners consume exactly these numeric results and the original completed flight.
   * Reuses the existing angle and flight contracts without a second physical state, synthetic derivative or success flag.
   */
  export interface IPoint {
    /** Fresh local momentum coordinates. */
    local: number[];
    /** Actual unwrapped endpoint in radians. */
    end: IAutoMovieSolveAirborneTakeoff.IAngles;
    /** Endpoint minus the current full stage target, radians. */
    r: number[];
    /** Angle derivatives for Newton, absent on residual-only and judged trials. */
    jacobian: number[][] | undefined;
    /** The actual numeric flight whose endpoint and residual were observed. */
    flight: IAutoMovieIntegrateAirborneRotation.IFlight;
  }

  /**
   * Trial evaluation and exact-point reuse within one unchanged solve.
   *
   * Defines actual optional-sensitivity evaluation, pure retargeting and operation release.
   * One evaluator owns one fixed physical history epoch; it cannot accept a trajectory on the solver's behalf.
   * Newton uses evaluate, continuation reuses retarget, and the takeoff operation calls clear in finally.
   * Candidate reuse requires current exact numeric momentum and actual derivative availability, without a public trusted-cache flag.
   */
  export interface IOperation {
    /** Integrate only the requested physical/tangent system, under the momentum control only when judged, or reuse an exactly equal search point having the required data. */
    evaluate(local: readonly number[], target: readonly number[], sensitive: boolean,
      current?: IPoint, rejected?: IPoint, judged?: boolean): IPoint;
    /** Change only the target subtracted from an unchanged physical endpoint. */
    retarget(point: IPoint, target: readonly number[]): IPoint;
    /** Release any operation-owned temporal partition on success or failure. */
    clear(): void;
  }
}
