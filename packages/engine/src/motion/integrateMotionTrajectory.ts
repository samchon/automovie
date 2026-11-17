import type {
  IAutoMovieIntegrateMotionTrajectory,
  IAutoMovieMotionTrajectoryInterval,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { MotionTrajectoryRead } from "./MotionTrajectoryRead";
import { MotionTrajectoryRotation } from "./MotionTrajectoryRotation";
import { MotionTrajectoryStepper } from "./MotionTrajectoryStepper";

const { turn, scaled, dexpinv }: typeof MotionTrajectoryRotation =
  MotionTrajectoryRotation;

/**
 * A trajectory planned once and read by time: the solution of `dx/dt = f(t, x)` from `t0` to `t1` by classical fourth-order Runge-Kutta at a fixed step, its knots kept with their derivatives and read between them by cubic Hermite interpolation.
 *
 * The step count is `ceil((t1 - t0) / h)`, the last step shortened to land on `t1` exactly. A state may carry an orientation block, a unit quaternion advanced on the exponential map by the body-frame angular velocity `f` returns, by the fourth-order Runge-Kutta-Munthe-Kaas method: each stage turns the step's start orientation by a rotation vector built from the earlier stages, each stage's body rate is carried to that vector's derivative by the inverse differential of the exponential, and the step turns the start by the stages' weighted vector, renormalised at each knot. Between knots the vector is the cubic Hermite of the two knots' values and derivatives, exact at knots and C1 between; the orientation is the start knot turned by the cubic Hermite of the rotation vector to the end knot, matching both knots' body rates, so a rate read between knots is the motion's and not the step's mean. Reads outside `[t0, t1]` hold the nearer end.
 *
 * Given a `tolerance`, Dormand-Prince 5(4) controls its existing endpoint RMS estimate. Its default continuous extension is quartic; orientation slopes at both ends use the exact right exponential Jacobian. An explicit `rotationDefect` additionally builds the paired quintic continuous extensions of Enright and Hayes and checks their actual body angular velocities in the caller's physical units. The maximum of the existing RMS and physical estimate controls the same step controller. These sampled estimates are not continuous or global-error certificates for an arbitrary pure callback.
 *
 * The output depends on the numeric inputs, pure `f` and optional pure defect callback, never on playback times or order. The default fixed step is a sixtieth of a second; a stiff RHS needs a smaller fixed step or adaptive control. Optional orientation-only playback reads the same solved quaternion without vector interpolation or vector copying, and still returns a fresh quaternion.
 * The caller supplies finite numeric state and rate components. This wrapper checks vector lengths and the presence of an angular rate for an oriented state; it does not validate the components of x0, dx or w for finiteness.
 *
 * @param props The right-hand side, the start state, the interval and the step.
 * @returns The trajectory.
 * @throws {Error} When interval, step, tolerance, partition, failure scope or defect-mode combination is invalid, the state is empty, required rate shape is missing, a defect is negative/NaN, or adaptive refinement reaches time resolution. Errors from the pure physical model propagate unchanged.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States method, knot count, orientation, held ends, determinism and stiffness; optional interval reads copy actual adjacent fixed states/rates with their knot seconds and remain absent for adaptive curves.
 * @evidence contracts/development/implementation.md#principled-implementation Classical RK4 or adaptive DP5(4) advances orientation by RKMK's truncated algebra differential (Munthe-Kaas 1999). Playback uses exact Jr^-1 endpoint slopes, fixing finite-step C1 matching. Optional paired continuous control measures actual Jr(r)r' through a caller-owned normalized physical defect without reinterpreting generic RMS units. Smoothness is an estimator premise, not an arbitrary-history guarantee.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit, hand adaptive requests to the stepper, else retain fixed knots. MotionTrajectoryRead owns both interpolation and fresh actual-interval snapshots selected by the same adjacent index.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The frame grid never enters integration; reads use actual retained knots. Fixed interval snapshots neither resample the model nor classify adaptive extensions as cubic Hermite data.
 * @evidence contracts/development/implementation.md#efficient-algorithms Fixed integration uses four new f calls per step after the initial call; adaptive trials use six, with four additional paired-extension calls when a physical defect is requested and the RMS admits. Physical callback probes additionally depend on the paired polynomials' extrema. Full reads cost O(n+1) plus interval lookup and copy output; quaternion projection skips the vector block and costs O(1) fixed or O(log A) adaptive.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Each knot's derivative is the next step's first stage, evaluated once. Fixed retained rates are numeric snapshots; intermediate stages borrow the pure callback's results without modifying them. The zero-dimensional vector has no components to advance and shares its private empty record across stages and knots; nonempty states remain separate. Readers reuse only their immediately preceding Object.is-equal requested time and always copy public output.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Fixed output holds ceil((t1-t0)/h)+1 owned numeric states and rate snapshots; adaptive output holds accepted numeric steps with no fixed count bound. MotionTrajectoryRead constructs both readers outside the callback's scope, retaining at most one previous read and returning fresh vector and orientation records, so only completed numeric data escapes.
 */
export function integrateMotionTrajectory(
  props: IAutoMovieIntegrateMotionTrajectory.IProps,
): IAutoMovieIntegrateMotionTrajectory.ITrajectory {
  const h: number = props.h ?? integrateMotionTrajectory.STEP;
  const { t0, t1 } = props;
  if (!(Number.isFinite(t0) && Number.isFinite(t1) && t1 > t0))
    throw new Error(
      `integrateMotionTrajectory: the interval ${t0} to ${t1} is not finite and forward`,
    );
  if (!(Number.isFinite(h) && h > 0))
    throw new Error(`integrateMotionTrajectory: the step ${h} is not positive`);
  if (props.errorScope !== undefined && typeof props.errorScope !== "symbol")
    throw new Error("integrateMotionTrajectory: an error scope must be a symbol");
  const n: number = props.x0.length;
  const oriented: boolean = props.q0 !== undefined;
  if (props.rotationDefect !== undefined && (!oriented || props.tolerance === undefined))
    throw new Error("Continuous rotation-defect control requires an orientation and adaptive tolerance");
  if (n === 0 && !oriented)
    throw new Error("integrateMotionTrajectory: the state is empty");
  const rate: IAutoMovieIntegrateMotionTrajectory.IProps["f"] = (
    t: number,
    x: readonly number[],
    q: IAutoMovieQuaternion | null,
  ): IAutoMovieIntegrateMotionTrajectory.IRate => {
    const r: IAutoMovieIntegrateMotionTrajectory.IRate = props.f(t, x, q);
    if (r.dx.length !== n)
      throw new Error(
        `integrateMotionTrajectory: f returned ${r.dx.length} rates for ${n} states`,
      );
    if (oriented && r.w === undefined)
      throw new Error(
        "integrateMotionTrajectory: f returned no angular velocity for the orientation",
      );
    return r;
  };
  if (props.tolerance !== undefined) {
    const { relative, absolute } = props.tolerance;
    if (
      !(relative >= 0 && absolute >= 0 && relative + absolute > 0) ||
      !Number.isFinite(relative + absolute)
    )
      throw new Error(
        `integrateMotionTrajectory: the tolerance ${relative} relative and ${absolute} absolute is not finite, non-negative and non-zero`,
      );
    const blocks: readonly number[] | undefined = props.tolerance.blocks;
    if (blocks !== undefined) {
      let dimensions: number = 0;
      let valid: boolean = true;
      for (const width of blocks) {
        if (!Number.isSafeInteger(width) || width <= 0) {
          valid = false;
          break;
        }
        dimensions += width;
      }
      if (!valid || dimensions !== n)
        throw new Error(
          "integrateMotionTrajectory: error blocks must be positive integers partitioning the vector state",
        );
    }
    return MotionTrajectoryStepper.dormandPrince(props, rate, h);
  }
  const add: (
    x: number[],
    k: readonly number[],
    s: number,
  ) => number[] = (
    x: number[],
    k: readonly number[],
    s: number,
  ): number[] =>
    x.length === 0
      ? x
      : x.map((v: number, i: number): number => v + s * k[i]!);

  // Only retained knot derivatives need an owned snapshot. Copy numeric
  // indices rather than iterating an externally supplied derivative array.
  const retained: IAutoMovieIntegrateMotionTrajectory.IProps["f"] = (
    t: number,
    x: readonly number[],
    q: IAutoMovieQuaternion | null,
  ): IAutoMovieIntegrateMotionTrajectory.IRate => {
    const r: IAutoMovieIntegrateMotionTrajectory.IRate = rate(t, x, q);
    let dx: readonly number[] = x;
    if (n !== 0) {
      const values: number[] = [];
      for (let i: number = 0; i < n; i++) values.push(r.dx[i]!);
      dx = values;
    }
    const w: IAutoMovieVector3 | undefined = oriented ? r.w : undefined;
    return {
      dx,
      w: w === undefined ? undefined : { x: w.x, y: w.y, z: w.z },
    };
  };

  // Step to t1, the last step shortened to land on it exactly; each knot keeps its derivative.
  const steps: number = Math.ceil((t1 - t0) / h);
  const times: number[] = [t0];
  const xs: number[][] = [[...props.x0]];
  const qs: (IAutoMovieQuaternion | null)[] = [
    oriented ? Quaternion.normalize(props.q0!) : null,
  ];
  const ks: IAutoMovieIntegrateMotionTrajectory.IRate[] = [retained(t0, xs[0]!, qs[0]!)];
  for (let s: number = 0; s < steps; s++) {
    const t: number = times[s]!;
    const next: number = s === steps - 1 ? t1 : t0 + (s + 1) * h;
    const dt: number = next - t;
    const x: number[] = xs[s]!;
    const q: IAutoMovieQuaternion | null = qs[s]!;

    // Runge-Kutta-Munthe-Kaas: each stage's orientation is the step's start
    // turned by a rotation vector, and the stage's body rate is carried back
    // to that vector's derivative by the inverse differential of the
    // exponential, so the orientation keeps the method's fourth order.
    const k1: IAutoMovieIntegrateMotionTrajectory.IRate = ks[s]!;
    const u1: IAutoMovieVector3 | undefined = k1.w;
    const v2: IAutoMovieVector3 | undefined = oriented
      ? scaled(u1, dt / 2)
      : undefined;
    const k2: IAutoMovieIntegrateMotionTrajectory.IRate = rate(
      t + dt / 2,
      add(x, k1.dx, dt / 2),
      oriented ? turn(q, v2) : null,
    );
    const u2: IAutoMovieVector3 | undefined = oriented
      ? dexpinv(v2, k2.w)
      : undefined;
    const v3: IAutoMovieVector3 | undefined = oriented
      ? scaled(u2, dt / 2)
      : undefined;
    const k3: IAutoMovieIntegrateMotionTrajectory.IRate = rate(
      t + dt / 2,
      add(x, k2.dx, dt / 2),
      oriented ? turn(q, v3) : null,
    );
    const u3: IAutoMovieVector3 | undefined = oriented
      ? dexpinv(v3, k3.w)
      : undefined;
    const v4: IAutoMovieVector3 | undefined = oriented
      ? scaled(u3, dt)
      : undefined;
    const k4: IAutoMovieIntegrateMotionTrajectory.IRate = rate(
      t + dt,
      add(x, k3.dx, dt),
      oriented ? turn(q, v4) : null,
    );
    const u4: IAutoMovieVector3 | undefined = oriented
      ? dexpinv(v4, k4.w)
      : undefined;
    const xn: number[] =
      n === 0
        ? x
        : x.map(
            (v: number, i: number): number =>
              v +
              (dt / 6) *
                (k1.dx[i]! + 2 * k2.dx[i]! + 2 * k3.dx[i]! + k4.dx[i]!),
          );
    const step: IAutoMovieVector3 | undefined =
      q === null
        ? undefined
        : {
            x: (dt / 6) * (u1!.x + 2 * u2!.x + 2 * u3!.x + u4!.x),
            y: (dt / 6) * (u1!.y + 2 * u2!.y + 2 * u3!.y + u4!.y),
            z: (dt / 6) * (u1!.z + 2 * u2!.z + 2 * u3!.z + u4!.z),
          };
    const qn: IAutoMovieQuaternion | null =
      q === null ? null : Quaternion.normalize(turn(q, step)!);
    times.push(next);
    xs.push(xn);
    qs.push(qn);
    ks.push(retained(next, xn, qn));
  }

  return MotionTrajectoryRead.fixed({ t0, t1, h, times, xs, qs, ks, oriented });
}

/**
 * Companion types and the default step of {@link integrateMotionTrajectory}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each type states its members' units and meaning.
 * @evidence contracts/development/design.md#principled-representation A vector state of plain numbers with an optional unit quaternion, a right-hand side returning the state's rate and the body-frame angular velocity, and an immutable trajectory read by time.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the engine as the one ODE integrator (P3 on #3503), fixed-step or, on request, error-controlled; read by the archetypes' towed ride and the motion laws #3424 unblocks.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The orientation is a separate block, so a quaternion is never integrated as four free numbers.
 */
export namespace integrateMotionTrajectory {
  /** Actual fixed Hermite knot data; the top-level owner documents its units and independent arrays. */
  export type IInterval = IAutoMovieMotionTrajectoryInterval;

  /** The default step, seconds: a sixtieth of a second, under which the classical method's error stays far below a millimetre for the motions planned (#3424). */
  export const STEP: number = 1 / 60;
}
