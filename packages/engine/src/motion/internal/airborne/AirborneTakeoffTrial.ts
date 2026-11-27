import type {
  IAutoMovieIntegrateAirborneRotation,
  IAutoMovieQuaternion,
  IAutoMovieSolveAirborneTakeoff,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineQuaternion } from "../../../math/AutoMovieEngineQuaternion";
import { AirborneShapeHistory } from "./AirborneShapeHistory";
import { AirborneTakeoffAngles } from "./AirborneTakeoffAngles";
import { AirborneTakeoffJacobian } from "./AirborneTakeoffJacobian";
import { MotionTrajectoryPartition } from "../trajectory/MotionTrajectoryPartition";
import { IntegrateAirborneRotationImplementation } from "../IntegrateAirborneRotationImplementation";

/*
 * Evaluate shooting points with optional momentum sensitivities. A search point
 * is integrated under the embedded error estimate alone (the integration
 * tolerance); the sampled dense momentum control, which certifies the momentum
 * a displayed flight carries, is paid only by the judged evaluation of the
 * solution (`judged`), the one flight that is played back and refused or
 * accepted.
 * Parameter props: One unchanged physical history, flight and numerical budgets.
 * Parameter axes: Requested turning axes in the takeoff root frame.
 * Parameter frame: Their world orientation at takeoff.
 * Returns: Call-local trial, retarget and mesh-release operations.
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
    (i: number): IAutoMovieVector3 =>
      AutoMovieEngineQuaternion.rotateVector(frame, {
        x: i === 0 ? 1 : 0,
        y: i === 1 ? 1 : 0,
        z: i === 2 ? 1 : 0,
      }),
  );
  const retarget: AirborneTakeoffTrial.IOperation["retarget"] = (
    point: AirborneTakeoffTrial.IPoint,
    target: readonly number[],
  ): AirborneTakeoffTrial.IPoint => ({
    ...point,
    r: [
      point.end.somersault - target[0]!,
      point.end.tilt - target[1]!,
      point.end.twist - target[2]!,
    ],
  });
  return {
    retarget,
    clear: (): void => partition?.clear(),
    evaluate: (
      local: readonly number[],
      target: readonly number[],
      sensitive: boolean,
      current?: AirborneTakeoffTrial.IPoint,
      rejected?: AirborneTakeoffTrial.IPoint,
      judged?: boolean,
    ): AirborneTakeoffTrial.IPoint => {
      const known: AirborneTakeoffTrial.IPoint | undefined = [
        current,
        rejected,
      ].find(
        (point: AirborneTakeoffTrial.IPoint | undefined): boolean =>
          judged !== true &&
          point !== undefined &&
          (!sensitive || point.jacobian !== undefined) &&
          point.local.length === local.length &&
          local.every((v: number, i: number): boolean =>
            Object.is(v, point.local[i]),
          ),
      );
      if (known !== undefined) return retarget(known, target);
      const flight: IAutoMovieIntegrateAirborneRotation.IFlight =
        IntegrateAirborneRotationImplementation.integrateAirborneRotation({
          history: props.history,
          t0: props.t0,
          t1: props.t1,
          q0: props.q0,
          momentum: AutoMovieEngineQuaternion.rotateVector(frame, {
            x: local[0]!,
            y: local[1]!,
            z: local[2]!,
          }),
          h: props.h,
          tolerance: props.integration,
          momentumTolerance:
            judged === true ? props.momentumTolerance : undefined,
          errorScope: props.errorScope,
          variations: sensitive ? directions : undefined,
          partition,
        });
      const end: IAutoMovieSolveAirborneTakeoff.IAngles =
        AirborneTakeoffAngles.unwrapped(
          {
            ...flight,
            orientation: (seconds: number): IAutoMovieQuaternion =>
              AutoMovieEngineQuaternion.multiply(flight.orientation(seconds), axes),
          },
          frame,
        );
      return retarget(
        {
          local: [...local],
          end,
          r: [],
          flight,
          // Only Newton consumes angle derivatives. The judged flight still
          // carries the integrated momentum sensitivities for public playback.
          jacobian:
            sensitive && judged !== true
              ? AirborneTakeoffJacobian(end, axes, flight.variations(props.t1))
              : undefined,
        },
        target,
      );
    },
  };
}

/*
 * Physical shooting points and their call-local evaluator.
 */
export namespace AirborneTakeoffTrial {
  /*
   * A physical trial at takeoff-frame momentum components, kg m squared per
   * second.
   *
   * Each member states physical momentum, actual radian endpoint/residual,
   * derivative availability and completed-flight ownership. An actual solved
   * trajectory accompanies every endpoint and residual. Only a search point
   * requiring angle derivatives materializes its Jacobian. The Newton and
   * continuation owners consume exactly these numeric results and the original
   * completed flight. Reuses the existing angle and flight contracts without a
   * second physical state, synthetic derivative or success flag.
   */
  export interface IPoint {
    /*
     * Fresh local momentum coordinates.
     */
    local: number[];
    /*
     * Actual unwrapped endpoint in radians.
     */
    end: IAutoMovieSolveAirborneTakeoff.IAngles;
    /*
     * Endpoint minus the current full stage target, radians.
     */
    r: number[];
    /*
     * Angle derivatives for Newton, absent on residual-only and judged trials.
     */
    jacobian: number[][] | undefined;
    /*
     * The actual numeric flight whose endpoint and residual were observed.
     */
    flight: IAutoMovieIntegrateAirborneRotation.IFlight;
  }

  /*
   * Trial evaluation and exact-point reuse within one unchanged solve.
   *
   * Defines actual optional-sensitivity evaluation, pure retargeting and
   * operation release. One evaluator owns one fixed physical history epoch; it
   * cannot accept a trajectory on the solver's behalf. Newton uses evaluate,
   * continuation reuses retarget, and the takeoff operation calls clear in
   * finally. Candidate reuse requires current exact numeric momentum and actual
   * derivative availability, without a public trusted-cache flag.
   */
  export interface IOperation {
    /*
     * Integrate only the requested physical/tangent system, under the momentum
     * control only when judged, or reuse an exactly equal search point having
     * the required data.
     */
    evaluate(
      local: readonly number[],
      target: readonly number[],
      sensitive: boolean,
      current?: IPoint,
      rejected?: IPoint,
      judged?: boolean,
    ): IPoint;
    /*
     * Change only the target subtracted from an unchanged physical endpoint.
     */
    retarget(point: IPoint, target: readonly number[]): IPoint;
    /*
     * Release any operation-owned temporal partition on success or failure.
     */
    clear(): void;
  }
}
