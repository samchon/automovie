import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";

/**
 * A trajectory planned once and read by time: the solution of `dx/dt = f(t, x)` from `t0` to `t1` by classical fourth-order Runge-Kutta at a fixed step, its knots kept with their derivatives and read between them by cubic Hermite interpolation.
 *
 * The step count is `ceil((t1 - t0) / h)`, the last step shortened to land on `t1` exactly. A state may carry an orientation block, a unit quaternion advanced on the exponential map by the body-frame angular velocity `f` returns: each stage turns the step's start orientation by `exp(c h w / 2)` with the previous stage's rate, and the step's result by the stages' Runge-Kutta mean rate, renormalised at each knot. Between knots the vector is the cubic Hermite of the two knots' values and derivatives, exact at knots and C1 between; the orientation is the shortest-arc slerp of the two knots' quaternions by the elapsed share of the step, the constant body rate between them. Reads outside `[t0, t1]` hold the nearer end.
 *
 * The output depends only on `f`, `x0`, `q0`, `t0`, `t1` and `h`, never on which times are read or in which order, so a plan caches it as a value and playback and seeking read the same motion. `f` must be pure: no draw and no clock. The default step, a sixtieth of a second, keeps the classical method's error far under a millimetre for the motions planned here (#3424); a stiff `f`, such as a contact spring or a large drag, needs a smaller one.
 *
 * @param props The right-hand side, the start state, the interval and the step.
 * @returns The trajectory.
 * @throws {Error} When the interval or the step is not finite and positive, the state is empty when no orientation is given, or `f` returns a rate of another length or without an angular velocity for the orientation: a caller's defect.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the method, the step count, the orientation block, the read between knots, the held ends, the determinism contract, the default step and the stiff-case caveat.
 * @evidence contracts/development/implementation.md#principled-implementation Classical RK4 (Butcher's tableau 1/2, 1/2, 1 with weights 1/6, 1/3, 1/3, 1/6), whose global error is fourth order in the step; cubic Hermite interpolation with the knots' exact derivatives; the orientation advanced by the Lie-group exponential, which keeps it on the unit sphere, with the step's increment the exponential of the stages' weighted body rate. Its error beyond the vector part's is the rate axis's turn within a step, second order in it, small at the steps used; stated, not hidden.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit, step to `t1` keeping knots, then a reader that finds the knot interval by index.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The frame grid never enters the integration; reads are pure functions of the knots.
 * @evidence contracts/development/implementation.md#efficient-algorithms Four evaluations of `f` per step and one at the last knot; a read finds its interval by division in constant time.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Each knot's derivative is the next step's first stage, evaluated once.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The trajectory holds one state and derivative per knot, `ceil((t1 - t0) / h) + 1` of them, for as long as its caller keeps it.
 */
export function integrateMotionTrajectory(
  props: integrateMotionTrajectory.IProps,
): integrateMotionTrajectory.ITrajectory {
  const h: number = props.h ?? integrateMotionTrajectory.STEP;
  const { t0, t1 } = props;
  if (!(Number.isFinite(t0) && Number.isFinite(t1) && t1 > t0))
    throw new Error(`integrateMotionTrajectory: the interval ${t0} to ${t1} is not finite and forward`);
  if (!(Number.isFinite(h) && h > 0))
    throw new Error(`integrateMotionTrajectory: the step ${h} is not positive`);
  const n: number = props.x0.length;
  const oriented: boolean = props.q0 !== undefined;
  if (n === 0 && !oriented)
    throw new Error("integrateMotionTrajectory: the state is empty");
  const rate = (
    t: number,
    x: readonly number[],
    q: IAutoMovieQuaternion | null,
  ): integrateMotionTrajectory.IRate => {
    const r: integrateMotionTrajectory.IRate = props.f(t, x, q);
    if (r.dx.length !== n)
      throw new Error(`integrateMotionTrajectory: f returned ${r.dx.length} rates for ${n} states`);
    if (oriented && r.w === undefined)
      throw new Error("integrateMotionTrajectory: f returned no angular velocity for the orientation");
    return r;
  };
  const add = (x: readonly number[], k: readonly number[], s: number): number[] =>
    x.map((v: number, i: number): number => v + s * k[i]!);

  // Step to t1, the last step shortened to land on it exactly; each knot keeps its derivative.
  const steps: number = Math.ceil((t1 - t0) / h);
  const times: number[] = [t0];
  const xs: number[][] = [[...props.x0]];
  const qs: (IAutoMovieQuaternion | null)[] = [oriented ? Quaternion.normalize(props.q0!) : null];
  const ks: integrateMotionTrajectory.IRate[] = [rate(t0, xs[0]!, qs[0]!)];
  for (let s: number = 0; s < steps; s++) {
    const t: number = times[s]!;
    const next: number = s === steps - 1 ? t1 : t0 + (s + 1) * h;
    const dt: number = next - t;
    const x: number[] = xs[s]!;
    const q: IAutoMovieQuaternion | null = qs[s]!;
    const k1: integrateMotionTrajectory.IRate = ks[s]!;
    const k2: integrateMotionTrajectory.IRate = rate(t + dt / 2, add(x, k1.dx, dt / 2), turn(q, k1.w, dt / 2));
    const k3: integrateMotionTrajectory.IRate = rate(t + dt / 2, add(x, k2.dx, dt / 2), turn(q, k2.w, dt / 2));
    const k4: integrateMotionTrajectory.IRate = rate(t + dt, add(x, k3.dx, dt), turn(q, k3.w, dt));
    const xn: number[] = x.map(
      (v: number, i: number): number =>
        v + (dt / 6) * (k1.dx[i]! + 2 * k2.dx[i]! + 2 * k3.dx[i]! + k4.dx[i]!),
    );
    const mean: IAutoMovieVector3 | undefined =
      q === null
        ? undefined
        : {
            x: (k1.w!.x + 2 * k2.w!.x + 2 * k3.w!.x + k4.w!.x) / 6,
            y: (k1.w!.y + 2 * k2.w!.y + 2 * k3.w!.y + k4.w!.y) / 6,
            z: (k1.w!.z + 2 * k2.w!.z + 2 * k3.w!.z + k4.w!.z) / 6,
          };
    const qn: IAutoMovieQuaternion | null = q === null ? null : Quaternion.normalize(turn(q, mean, dt)!);
    times.push(next);
    xs.push(xn);
    qs.push(qn);
    ks.push(rate(next, xn, qn));
  }

  return {
    t0,
    t1,
    h,
    knots: times.length,
    at: (time: number): integrateMotionTrajectory.IState => {
      const t: number = Math.max(t0, Math.min(t1, time));
      const i: number = Math.min(steps - 1, Math.floor((t - t0) / h));
      const a: number = times[i]!;
      const span: number = times[i + 1]! - a;
      const u: number = (t - a) / span;
      const u2: number = u * u;
      const u3: number = u2 * u;
      const h00: number = 2 * u3 - 3 * u2 + 1;
      const h10: number = u3 - 2 * u2 + u;
      const h01: number = -2 * u3 + 3 * u2;
      const h11: number = u3 - u2;
      const x0: number[] = xs[i]!;
      const x1: number[] = xs[i + 1]!;
      const d0: readonly number[] = ks[i]!.dx;
      const d1: readonly number[] = ks[i + 1]!.dx;
      return {
        x: x0.map(
          (v: number, k: number): number =>
            h00 * v + h10 * span * d0[k]! + h01 * x1[k]! + h11 * span * d1[k]!,
        ),
        q: oriented ? Quaternion.slerp(qs[i]!, qs[i + 1]!, u) : null,
      };
    },
  };
}

/**
 * Companion types and the default step of {@link integrateMotionTrajectory}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each type states its members' units and meaning.
 * @evidence contracts/development/design.md#principled-representation A vector state of plain numbers with an optional unit quaternion, a right-hand side returning the state's rate and the body-frame angular velocity, and an immutable trajectory read by time.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the engine as the one fixed-step ODE integrator (P3 on #3503); read by the archetypes' towed ride and the motion laws #3424 unblocks.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The orientation is a separate block, so a quaternion is never integrated as four free numbers.
 */
export namespace integrateMotionTrajectory {
  /** The default step, seconds: a sixtieth of a second, under which the classical method's error stays far below a millimetre for the motions planned (#3424). */
  export const STEP: number = 1 / 60;

  /**
   * What a trajectory is integrated from.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's unit and default.
   * @evidence contracts/development/design.md#principled-representation The right-hand side, the start state and orientation, the interval in seconds and the step.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; written by each caller.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IProps {
    /**
     * The right-hand side: the state's rate at a time, and with an orientation the body-frame angular velocity, radians per second. Pure.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the arguments, the result and purity.
     * @evidence contracts/development/implementation.md#principled-implementation Supplied by the caller from the physics of its motion.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One function of time and state.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts It may not draw or read a clock, so the trajectory is a value.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The caller's.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The caller's.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
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

    /** The step, seconds, positive; `STEP` when absent. */
    h?: number;
  }

  /**
   * A state's rate.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's unit.
   * @evidence contracts/development/design.md#principled-representation The vector's time derivative and the body-frame angular velocity in radians per second.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; returned by `IProps.f`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
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
   * @evidence contracts/development/common.md#meaningful-documentation States each member's meaning.
   * @evidence contracts/development/design.md#principled-representation The vector and the orientation, null without one.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; returned by `ITrajectory.at`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
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
   * @evidence contracts/development/common.md#meaningful-documentation States each member's meaning.
   * @evidence contracts/development/design.md#principled-representation The interval, the step, the knot count and a pure reader.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; returned by `integrateMotionTrajectory`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface ITrajectory {
    /** The first second. */
    t0: number;

    /** The last second. */
    t1: number;

    /** The step. */
    h: number;

    /** The number of knots, the steps plus one. */
    knots: number;

    /**
     * The state at a time, held at the ends outside `[t0, t1]`.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the argument and the held ends.
     * @evidence contracts/development/implementation.md#principled-implementation Cubic Hermite interpolation of the vector between the two knots that bracket the time with their exact derivatives, and slerp of the orientation by the elapsed share.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure Find the interval by index, then interpolate.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Outside the interval the end holds, never extrapolated.
     * @evidence contracts/development/implementation.md#efficient-algorithms Constant time per read.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the knots kept once.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing beyond the trajectory's closure.
     */
    at: (time: number) => IState;
  }
}

/**
 * An orientation turned by a body-frame angular velocity held for a time: `q * exp(dt w / 2)`, the rotation by `|w| dt` about `w` in the body's own frame.
 *
 * @param q The orientation, or null for a state without one.
 * @param w The body-frame angular velocity, radians per second.
 * @param dt The time, seconds.
 * @returns The turned orientation, or null.
 */
function turn(
  q: IAutoMovieQuaternion | null,
  w: IAutoMovieVector3 | undefined,
  dt: number,
): IAutoMovieQuaternion | null {
  if (q === null || w === undefined) return q;
  const speed: number = Math.hypot(w.x, w.y, w.z);
  if (speed === 0) return q;
  return Quaternion.multiply(
    q,
    Quaternion.fromAxisAngle(w, (speed * dt * 180) / Math.PI),
  );
}
