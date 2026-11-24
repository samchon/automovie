import type {
  IAutoMovieIntegrateAirborneRotation,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import type { physicalInertiaFactor } from "../physics/physicalInertiaFactor";
import { AirborneMomentumDefect } from "./AirborneMomentumDefect";
import { AirborneShapeHistory } from "./AirborneShapeHistory";
import { MotionTrajectoryRotation } from "./MotionTrajectoryRotation";
import { integrateMotionTrajectory } from "./integrateMotionTrajectory";

/**
 * Solve a constructor-proven fixed shape's commuting torque-free rotation.
 *
 * A constant shape has zero relative momentum. Its angular velocity is constant
 * only when its carried momentum lies on a principal axis, or its inertia is
 * spherical. Independent coordinate axes are proved from the actual tensor's
 * zero couplings, without an eigensolver's rounded axes. At zero nominal
 * momentum the exact first variation is eta=(t-t0) I^-1 R0^T dL, including all
 * requested momentum directions. A stationary curve reconstructs exactly zero
 * angular momentum at every instant, including under an explicit physical
 * budget. A rotating curve's sensitivities and physical control, other constant
 * tensors and arbitrary callbacks retain the original integration.
 *
 * @param props The unchanged flight inputs, in the integrator's frames and
 *   units.
 * @returns A fresh-output analytic flight, or undefined when proof or supported
 *   numerical admission is unavailable.
 */
export function solveAirborneInvariant(
  props: IAutoMovieIntegrateAirborneRotation.IProps,
): IAutoMovieIntegrateAirborneRotation.IFlight | undefined {
  const stationary: boolean =
    props.momentum.x === 0 && props.momentum.y === 0 && props.momentum.z === 0;
  if (
    props.momentumTolerance !== undefined &&
    (!stationary || props.tolerance === undefined)
  )
    return undefined;

  const { t0, t1 }: IAutoMovieIntegrateAirborneRotation.IProps = props;
  const h: number = props.h ?? integrateMotionTrajectory.STEP;
  if (t1 <= t0 || h <= 0) return undefined;
  const tolerance: IAutoMovieIntegrateAirborneRotation.IProps["tolerance"] =
    props.tolerance;
  if (
    tolerance !== undefined &&
    (tolerance.relative < 0 ||
      tolerance.absolute < 0 ||
      tolerance.relative + tolerance.absolute <= 0)
  )
    return undefined;

  const factor: physicalInertiaFactor.IPrepared | undefined =
    AirborneShapeHistory.constant(props.history, t0, t1);
  if (factor === undefined) return undefined;
  const q0: IAutoMovieQuaternion = Quaternion.normalize(props.q0);
  const back: IAutoMovieQuaternion = Quaternion.inverse(q0);
  const carried: IAutoMovieVector3 = Quaternion.rotateVector(
    back,
    props.momentum,
  );


  const x: IAutoMovieVector3 = factor.apply({ x: 1, y: 0, z: 0 });
  const y: IAutoMovieVector3 = factor.apply({ x: 0, y: 1, z: 0 });
  const z: IAutoMovieVector3 = factor.apply({ x: 0, y: 0, z: 1 });
  const spherical: boolean =
    x.y === 0 && x.z === 0 && y.z === 0 && x.x === y.y && y.y === z.z;
  const principal: boolean =
    (carried.y === 0 && carried.z === 0 && x.y === 0 && x.z === 0) ||
    (carried.x === 0 && carried.z === 0 && y.x === 0 && y.z === 0) ||
    (carried.x === 0 && carried.y === 0 && z.x === 0 && z.y === 0);
  if (!stationary && carried.x === 0 && carried.y === 0 && carried.z === 0)
    return undefined;
  if (!spherical && !principal && !stationary) return undefined;
  const directions: readonly IAutoMovieVector3[] = props.variations ?? [];
  if (!stationary && directions.length !== 0) return undefined;


  const rate: IAutoMovieVector3 = factor.solve(carried);

  const tangents: IAutoMovieVector3[] = directions.map(
    (direction: IAutoMovieVector3): IAutoMovieVector3 =>
      factor.solve(Quaternion.rotateVector(back, direction)),
  );

  if (props.momentumTolerance !== undefined) {
    const defect: ReturnType<typeof AirborneMomentumDefect> =
      AirborneMomentumDefect(
        props.history,
        props.momentum,
        props.momentumTolerance,
      );
    if (defect(t0, q0, rate) !== 0) return undefined;
  }
  return flight(t0, t1, h, q0, rate, tangents);
}


/**
 * Own only completed numeric data; endpoint holds and zero rotations still
 * copy.
 */
function flight(
  t0: number,
  t1: number,
  h: number,
  initial: IAutoMovieQuaternion,
  rate: IAutoMovieVector3,
  directions: readonly IAutoMovieVector3[],
): IAutoMovieIntegrateAirborneRotation.IFlight {
  const q0: IAutoMovieQuaternion = {
    x: initial.x,
    y: initial.y,
    z: initial.z,
    w: initial.w,
  };
  const w: IAutoMovieVector3 = { x: rate.x, y: rate.y, z: rate.z };
  const tangents: IAutoMovieVector3[] = directions.map(
    (value: IAutoMovieVector3): IAutoMovieVector3 => ({
      x: value.x,
      y: value.y,
      z: value.z,
    }),
  );
  return {
    t0,
    t1,
    h,
    knots: 2,
    orientation: (seconds: number): IAutoMovieQuaternion => {
      const elapsed: number = Math.max(t0, Math.min(t1, seconds)) - t0;
      const result: IAutoMovieQuaternion = MotionTrajectoryRotation.turn(q0, {
        x: elapsed * w.x,
        y: elapsed * w.y,
        z: elapsed * w.z,
      })!;
      return { x: result.x, y: result.y, z: result.z, w: result.w };
    },
    variations: (seconds: number): readonly IAutoMovieVector3[] => {
      const elapsed: number = Math.max(t0, Math.min(t1, seconds)) - t0;
      return tangents.map(
        (value: IAutoMovieVector3): IAutoMovieVector3 => ({
          x: elapsed * value.x,
          y: elapsed * value.y,
          z: elapsed * value.z,
        }),
      );
    },
  };
}
