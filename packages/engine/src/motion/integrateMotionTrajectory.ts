import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import type { IMotionTrajectoryInterval } from "./IMotionTrajectoryInterval";
import { MotionTrajectoryRead } from "./MotionTrajectoryRead";
import type { MotionTrajectoryPartition } from "./MotionTrajectoryPartition";
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
  props: integrateMotionTrajectory.IProps,
): integrateMotionTrajectory.ITrajectory {
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
  const rate: integrateMotionTrajectory.IProps["f"] = (
    t: number,
    x: readonly number[],
    q: IAutoMovieQuaternion | null,
  ): integrateMotionTrajectory.IRate => {
    const r: integrateMotionTrajectory.IRate = props.f(t, x, q);
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
  const retained: integrateMotionTrajectory.IProps["f"] = (
    t: number,
    x: readonly number[],
    q: IAutoMovieQuaternion | null,
  ): integrateMotionTrajectory.IRate => {
    const r: integrateMotionTrajectory.IRate = rate(t, x, q);
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
  const ks: integrateMotionTrajectory.IRate[] = [retained(t0, xs[0]!, qs[0]!)];
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
    const k1: integrateMotionTrajectory.IRate = ks[s]!;
    const u1: IAutoMovieVector3 | undefined = k1.w;
    const v2: IAutoMovieVector3 | undefined = oriented
      ? scaled(u1, dt / 2)
      : undefined;
    const k2: integrateMotionTrajectory.IRate = rate(
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
    const k3: integrateMotionTrajectory.IRate = rate(
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
    const k4: integrateMotionTrajectory.IRate = rate(
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
  export type IInterval = IMotionTrajectoryInterval;

  /** The default step, seconds: a sixtieth of a second, under which the classical method's error stays far below a millimetre for the motions planned (#3424). */
  export const STEP: number = 1 / 60;

  /**
   * What a trajectory is integrated from.
   *
   */
  export interface IProps {
    /**
     * The right-hand side: the state's rate at a time, and with an orientation the body-frame angular velocity, radians per second. Pure.
     *
     */
    f: (
      t: number,
      x: readonly number[],
      q: IAutoMovieQuaternion | null,
    ) => IRate;

    /** The vector state at `t0`. */
    x0: readonly number[];

    /** The orientation at `t0`, a unit quaternion; absent for a state without one. */
    q0?: IAutoMovieQuaternion;

    /** The first second. */
    t0: number;

    /** The last second, after `t0`. */
    t1: number;

    /** The step, seconds, positive; `STEP` when absent. Under a `tolerance`, the first step tried. */
    h?: number;

    /**
     * Error control: when given, the trajectory is integrated by the
     * Dormand-Prince 5(4) pair with steps chosen so each step's error
     * estimate stays within it, and read between knots by the pair's
     * continuous extension; when absent, the fixed-step classical method.
     */
    tolerance?: ITolerance;

    /**
     * Optional continuous rotation-defect admission. Receives film seconds,
     * the dense orientation and its actual body angular velocity in rad/s.
     * The pure callback returns a nonnegative error normalized in its own
     * physical units: at most one admits, Infinity rejects. Adaptive dense
     * control checks paired extensions independently of the existing RMS.
     * Requires both q0 and an adaptive tolerance; otherwise admission throws.
     * Smoothness underlies the sampled estimator; arbitrary unsampled history
     * features and a downstream finite-difference observer are not certified.
     * Borrowed numeric records must not be mutated or retained for mutation.
     */
    rotationDefect?: (
      seconds: number,
      q: IAutoMovieQuaternion,
      w: IAutoMovieVector3,
    ) => number;

    /** Optional caller-owned unique symbol correlating this operation's failures. Admitted before the first RHS and copied only to this integration's MotionTrajectoryFailure; it affects no numerical decision and is not passed to f or rotationDefect. */
    errorScope?: symbol;

    /** Optional operation-owned adaptive time mesh. Every trial still computes and admits its own states, RMS and dense physical defect; only exact interval boundaries are shared. The caller releases the mesh after its whole operation. Ignored in fixed-step mode. */
    partition?: MotionTrajectoryPartition.IPartition;
  }

  /**
   * A step's accepted error, per component: `absolute + relative × |value|`,
   * the vector state's value the larger of the step's two ends, the
   * orientation's the length of its rotation vector over the step, the
   * error norm the root mean square of the components' error over that.
   * An explicit same-unit vector partition instead controls each block
   * independently and takes the maximum with the orientation's original RMS.
   *
   * Relative error is dimensionless, absolute error is in each state's own unit, and blocks specify a Euclidean partition.
   * Nonnegative finite budgets with a nonzero sum are runtime-admitted; optional positive integer block lengths must partition the vector, with [] only for an empty vector.
   * The integrator owns local error admission. Existing callers keep componentwise RMS; airborne's same-unit sensitivity matrix uses one Euclidean block without changing its orientation budget.
   * No absolute floor or action-specific precision is added. Each block uses its declared units; a local embedded estimate is not a global physical-error or Newton-convergence certificate.
   */
  export interface ITolerance {
    /** The share of a component's value, non-negative. */
    relative: number;

    /** The component's own unit, non-negative; not both zero. */
    absolute: number;

    /** Optional partition into same-unit Euclidean vector blocks. Positive integer lengths must sum to x0.length; [] is valid only for an empty vector. Each block controls ||error||/(sqrt(length)*absolute + relative*max(||start||,||end||)); the maximum of these errors and the orientation's existing RMS controls acceptance. Without blocks the existing componentwise RMS is unchanged. Equal numeric absolute tolerances act in each block's own units, not equal physical units across blocks. */
    blocks?: readonly number[];
  }

  /**
   * A state's rate.
   *
   */
  export interface IRate {
    /** The vector state's derivative, one per component. */
    dx: readonly number[];

    /** The body-frame angular velocity, radians per second; required when the state has an orientation. */
    w?: IAutoMovieVector3;
  }

  /**
   * A state read at one time.
   *
   */
  export interface IState {
    /** The vector state. */
    x: number[];

    /** The orientation, or null. */
    q: IAutoMovieQuaternion | null;
  }

  /**
   * An integrated trajectory.
   *
   */
  export interface ITrajectory {
    /** The first second. */
    t0: number;

    /** The last second. */
    t1: number;

    /** The step; under a tolerance, the first step tried. */
    h: number;

    /** The number of knots, the steps plus one. */
    knots: number;

    /** The knots' times, seconds, from `t0` to `t1`: a fixed grid, or the accepted steps' ends under a tolerance. */
    times: readonly number[];

    /** Read fresh copies of adjacent actual fixed Hermite states and rates; absent for adaptive continuous extensions. Query seconds are finite and outside times select the nearest end interval. */
    interval?: (time: number) => IInterval;

    /**
     * The state at a time, held at the ends outside `[t0, t1]`. Each call
     * owns its mutable vector and quaternion, including repeated reads.
     *
     */
    at: (time: number) => IState;

    /** Optional orientation-only projection of the same solved curve. Each read returns a fresh quaternion or null, without evaluating or copying the vector block. */
    orientation?: (time: number) => IAutoMovieQuaternion | null;
  }
}
