import type { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import type { physicalInertiaFactor } from "../physics/physicalInertiaFactor";
import { AirborneMomentumDefect } from "./AirborneMomentumDefect";
import { AirborneShapeHistory } from "./AirborneShapeHistory";
import { MotionTrajectoryRotation } from "./MotionTrajectoryRotation";
import type { integrateAirborneRotation } from "./integrateAirborneRotation";
import { integrateMotionTrajectory } from "./integrateMotionTrajectory";

/**
 * Solve a constructor-proven fixed shape's commuting torque-free rotation.
 *
 * A constant shape has zero relative momentum. Its angular velocity is
 * constant only when its carried momentum lies on a principal axis, or its
 * inertia is spherical. Independent coordinate axes are proved from the
 * actual tensor's zero couplings, without an eigensolver's rounded axes.
 * At zero nominal momentum the exact first variation is
 * eta=(t-t0) I^-1 R0^T dL, including all requested momentum directions.
 * A stationary curve reconstructs exactly zero angular momentum at every
 * instant, including under an explicit physical budget. A rotating curve's
 * sensitivities and physical control, other constant tensors and arbitrary
 * callbacks retain the original integration.
 *
 * @param props The unchanged flight inputs, in the integrator's frames and units.
 * @returns A fresh-output analytic flight, or undefined when proof or supported numerical admission is unavailable.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States constructor proof, zero relative momentum, exact tensor-axis eligibility, units inherited from the flight, absent-result fallback, held endpoint reads and independent quaternion ownership. Its knot count is the exact curve's two interval boundaries rather than numerical accepted steps; only the start quaternion and fixed rate are stored. The requested/default step metadata is preserved.
 * @evidence contracts/development/implementation.md#principled-implementation From L=R I w with constant I and zero relative momentum, a principal-axis carried L gives constant w and R=R0 Exp((t-t0)w). Only native fixed-shape provenance plus actual zero tensor couplings, or actual equal diagonal entries with zero coupling, establishes this premise. At zero nominal momentum the exact sensitivity ODE reduces to eta'=I^-1 R0^T dL, so all requested columns are computed, including transverse ones. The stationary curve's reconstructed R(I*0+0) is exactly zero at all times; the existing defect owner admits an explicit budget and checks its actual start data. No arbitrary constant anisotropic spin is treated as commuting.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The entry checks supported inputs and tensor invariants; a separate numeric-only reader factory owns the completed analytic curve so playback captures neither a shape history nor physical preparation.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No law, body, seed, requested angle, sampled equality, near symmetry or caller-provided proof flag selects the solution. Unsupported momentum directions, nonstationary sensitivities and rotating dense physical budgets return undefined to the unchanged integrator. The stationary zero-defect identity introduces no physical error floor or changed budget. Returned stationary sensitivities are actual inverse-inertia responses, never synthetic zero columns. Shooting still observes the actual curve, winding and momentum ceiling.
 * @evidence contracts/development/implementation.md#efficient-algorithms After the native owner's proof and any first O(S) shape reduction for S mass parts, eligibility uses three fixed-size tensor products, one physical solve and one solve per stationary sensitivity direction. An explicit stationary physical budget adds the existing defect owner's start-history query and fixed-size reconstruction. Playback retains O(k) numeric directions and takes O(k) work per tangent read; orientation reads take constant work. It does not traverse a time grid or claim a measured end-to-end speedup.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The history owner lends its constructor-proven immutable constant tensor factor for the nominal rate and all stationary tangent directions. The completed flight copies only its normalized initial quaternion, fixed rates and scalar interval metadata; no input-dependent module cache is introduced.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Playback owns a fixed numeric interval, quaternion and nominal rate plus k requested tangent-rate records, and returns fresh quaternions, tangent arrays and tangent vectors. It retains no history, model, factor, callback or query population.
 */
export function solveAirborneInvariant(
  props: integrateAirborneRotation.IProps,
): integrateAirborneRotation.IFlight | undefined {
  const stationary: boolean = props.momentum.x === 0 && props.momentum.y === 0
    && props.momentum.z === 0;
  if (props.momentumTolerance !== undefined && (!stationary || props.tolerance === undefined))
    return undefined;

  const { t0, t1 }: integrateAirborneRotation.IProps = props;
  const h: number = props.h ?? integrateMotionTrajectory.STEP;
  if (!Number.isFinite(t0) || !Number.isFinite(t1) || !(t1 > t0)
      || !Number.isFinite(h) || !(h > 0)
      || (props.errorScope !== undefined && typeof props.errorScope !== "symbol"))
    return undefined;
  const tolerance: integrateAirborneRotation.IProps["tolerance"] = props.tolerance;
  if (tolerance !== undefined && (!(tolerance.relative >= 0 && tolerance.absolute >= 0)
      || !(tolerance.relative + tolerance.absolute > 0)
      || !Number.isFinite(tolerance.relative + tolerance.absolute)))
    return undefined;

  const factor: physicalInertiaFactor.IPrepared | undefined =
    AirborneShapeHistory.constant(props.history, t0, t1);
  if (factor === undefined) return undefined;
  const q0: IAutoMovieQuaternion = Quaternion.normalize(props.q0);
  const back: IAutoMovieQuaternion = Quaternion.inverse(q0);
  const carried: IAutoMovieVector3 = Quaternion.rotateVector(back, props.momentum);
  if (!finite(carried) || !Number.isFinite(q0.x) || !Number.isFinite(q0.y)
      || !Number.isFinite(q0.z) || !Number.isFinite(q0.w))
    return undefined;

  const x: IAutoMovieVector3 = factor.apply({ x: 1, y: 0, z: 0 });
  const y: IAutoMovieVector3 = factor.apply({ x: 0, y: 1, z: 0 });
  const z: IAutoMovieVector3 = factor.apply({ x: 0, y: 0, z: 1 });
  const spherical: boolean = x.y === 0 && x.z === 0 && y.z === 0
    && x.x === y.y && y.y === z.z;
  const principal: boolean = (carried.y === 0 && carried.z === 0 && x.y === 0 && x.z === 0)
    || (carried.x === 0 && carried.z === 0 && y.x === 0 && y.z === 0)
    || (carried.x === 0 && carried.y === 0 && z.x === 0 && z.y === 0);
  if (!stationary && carried.x === 0 && carried.y === 0 && carried.z === 0)
    return undefined;
  if (!spherical && !principal && !stationary) return undefined;
  const directions: readonly IAutoMovieVector3[] = props.variations ?? [];
  if (!stationary && directions.length !== 0) return undefined;
  for (let index: number = 0; index < directions.length; index++)
    if (!(index in directions) || !finite(directions[index]!)) return undefined;

  const rate: IAutoMovieVector3 = factor.solve(carried);
  const span: number = t1 - t0;
  if (!finite(rate) || !Number.isFinite(Math.hypot(rate.x, rate.y, rate.z) * span))
    return undefined;
  const tangents: IAutoMovieVector3[] = directions.map(
    (direction: IAutoMovieVector3): IAutoMovieVector3 =>
      factor.solve(Quaternion.rotateVector(back, direction)),
  );
  for (const tangent of tangents)
    if (!finite(tangent) || !Number.isFinite(Math.hypot(tangent.x, tangent.y, tangent.z) * span))
      return undefined;
  if (props.momentumTolerance !== undefined) {
    const defect: ReturnType<typeof AirborneMomentumDefect> = AirborneMomentumDefect(
      props.history, props.momentum, props.momentumTolerance,
    );
    if (defect(t0, q0, rate) !== 0) return undefined;
  }
  return flight(t0, t1, h, q0, rate, tangents);
}

/** Reject an unrepresentable physical vector before selecting the exact curve. */
function finite(value: IAutoMovieVector3): boolean {
  return Number.isFinite(value.x) && Number.isFinite(value.y) && Number.isFinite(value.z);
}

/** Own only completed numeric data; endpoint holds and zero rotations still copy. */
function flight(
  t0: number, t1: number, h: number,
  initial: IAutoMovieQuaternion, rate: IAutoMovieVector3,
  directions: readonly IAutoMovieVector3[],
): integrateAirborneRotation.IFlight {
  const q0: IAutoMovieQuaternion = { x: initial.x, y: initial.y, z: initial.z, w: initial.w };
  const w: IAutoMovieVector3 = { x: rate.x, y: rate.y, z: rate.z };
  const tangents: IAutoMovieVector3[] = directions.map(
    (value: IAutoMovieVector3): IAutoMovieVector3 => ({ x: value.x, y: value.y, z: value.z }),
  );
  return {
    t0, t1, h, knots: 2,
    orientation: (seconds: number): IAutoMovieQuaternion => {
      const elapsed: number = Math.max(t0, Math.min(t1, seconds)) - t0;
      const result: IAutoMovieQuaternion = MotionTrajectoryRotation.turn(q0, {
        x: elapsed * w.x, y: elapsed * w.y, z: elapsed * w.z,
      })!;
      return { x: result.x, y: result.y, z: result.z, w: result.w };
    },
    variations: (seconds: number): readonly IAutoMovieVector3[] => {
      const elapsed: number = Math.max(t0, Math.min(t1, seconds)) - t0;
      return tangents.map((value: IAutoMovieVector3): IAutoMovieVector3 => ({
        x: elapsed * value.x, y: elapsed * value.y, z: elapsed * value.z,
      }));
    },
  };
}
