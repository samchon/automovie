import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { MotionTrajectoryStepper } from "./MotionTrajectoryStepper";
import { samplePoseVelocity } from "./samplePoseVelocity";

const { turn, scaled, dexpinv } = MotionTrajectoryStepper;

/**
 * A trajectory planned once and read by time: the solution of `dx/dt = f(t, x)` from `t0` to `t1` by classical fourth-order Runge-Kutta at a fixed step, its knots kept with their derivatives and read between them by cubic Hermite interpolation.
 *
 * The step count is `ceil((t1 - t0) / h)`, the last step shortened to land on `t1` exactly. A state may carry an orientation block, a unit quaternion advanced on the exponential map by the body-frame angular velocity `f` returns, by the fourth-order Runge-Kutta-Munthe-Kaas method: each stage turns the step's start orientation by a rotation vector built from the earlier stages, each stage's body rate is carried to that vector's derivative by the inverse differential of the exponential, and the step turns the start by the stages' weighted vector, renormalised at each knot. Between knots the vector is the cubic Hermite of the two knots' values and derivatives, exact at knots and C1 between; the orientation is the start knot turned by the cubic Hermite of the rotation vector to the end knot, matching both knots' body rates, so a rate read between knots is the motion's and not the step's mean. Reads outside `[t0, t1]` hold the nearer end.
 *
 * Given a `tolerance`, the trajectory is integrated instead by the Dormand-Prince 5(4) pair under error control, each step as long as its error estimate allows, and read between its knots by the pair's continuous extension (`MotionTrajectoryStepper.dormandPrince`): a right-hand side that changes fast in places, such as a body's shape folding in flight, is followed there without a fine step everywhere. Without one, every number is the fixed step's as it always was.
 *
 * The output depends only on `f`, `x0`, `q0`, `t0`, `t1`, `h` and `tolerance`, never on which times are read or in which order, so a plan caches it as a value and playback and seeking read the same motion. `f` must be pure: no draw and no clock. The default step, a sixtieth of a second, keeps the classical method's error far under a millimetre for the motions planned here (#3424); a stiff `f`, such as a contact spring or a large drag, needs a smaller one.
 *
 * @param props The right-hand side, the start state, the interval and the step.
 * @returns The trajectory.
 * @throws {Error} When the interval or the step is not finite and positive, the tolerance is not finite, non-negative and non-zero, the state is empty when no orientation is given, or `f` returns a rate of another length or without an angular velocity for the orientation: a caller's defect; or when an error-controlled step shrinks below its time's resolution.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the method, the step count, the orientation block, the read between knots, the held ends, the determinism contract, the default step and the stiff-case caveat.
 * @evidence contracts/development/implementation.md#principled-implementation Classical RK4 (Butcher's tableau 1/2, 1/2, 1 with weights 1/6, 1/3, 1/3, 1/6), whose global error is fourth order in the step; cubic Hermite interpolation with the knots' exact derivatives; the orientation by Runge-Kutta-Munthe-Kaas (Munthe-Kaas 1999, Appl Numer Math 29:115-127), the classical tableau applied in the Lie algebra with the inverse differential of the exponential truncated after its second bracket, which keeps the fourth order on the unit sphere; its read between knots is the cubic Hermite of the rotation vector in the same algebra.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit, hand an error-controlled request to the stepper, else step to `t1` keeping knots, then a reader that finds the knot interval by index.
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
    throw new Error(
      `integrateMotionTrajectory: the interval ${t0} to ${t1} is not finite and forward`,
    );
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
    return MotionTrajectoryStepper.dormandPrince(props, rate, h);
  }
  const add = (
    x: readonly number[],
    k: readonly number[],
    s: number,
  ): number[] => x.map((v: number, i: number): number => v + s * k[i]!);

  // Step to t1, the last step shortened to land on it exactly; each knot keeps its derivative.
  const steps: number = Math.ceil((t1 - t0) / h);
  const times: number[] = [t0];
  const xs: number[][] = [[...props.x0]];
  const qs: (IAutoMovieQuaternion | null)[] = [
    oriented ? Quaternion.normalize(props.q0!) : null,
  ];
  const ks: integrateMotionTrajectory.IRate[] = [rate(t0, xs[0]!, qs[0]!)];
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
    const v2: IAutoMovieVector3 | undefined = scaled(u1, dt / 2);
    const k2: integrateMotionTrajectory.IRate = rate(
      t + dt / 2,
      add(x, k1.dx, dt / 2),
      turn(q, v2),
    );
    const u2: IAutoMovieVector3 | undefined = dexpinv(v2, k2.w);
    const v3: IAutoMovieVector3 | undefined = scaled(u2, dt / 2);
    const k3: integrateMotionTrajectory.IRate = rate(
      t + dt / 2,
      add(x, k2.dx, dt / 2),
      turn(q, v3),
    );
    const u3: IAutoMovieVector3 | undefined = dexpinv(v3, k3.w);
    const v4: IAutoMovieVector3 | undefined = scaled(u3, dt);
    const k4: integrateMotionTrajectory.IRate = rate(
      t + dt,
      add(x, k3.dx, dt),
      turn(q, v4),
    );
    const u4: IAutoMovieVector3 | undefined = dexpinv(v4, k4.w);
    const xn: number[] = x.map(
      (v: number, i: number): number =>
        v + (dt / 6) * (k1.dx[i]! + 2 * k2.dx[i]! + 2 * k3.dx[i]! + k4.dx[i]!),
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
    ks.push(rate(next, xn, qn));
  }

  return {
    t0,
    t1,
    h,
    knots: times.length,
    times,
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

      // The orientation: the start knot turned by the cubic Hermite of the
      // rotation vector, which meets the end knot with both knots' body
      // rates, the end's carried into the vector's derivative.
      let q: IAutoMovieQuaternion | null = null;
      if (oriented && u >= 1) q = qs[i + 1]!;
      else if (oriented) {
        const r1: IAutoMovieVector3 = samplePoseVelocity.rotationVector(
          Quaternion.multiply(Quaternion.inverse(qs[i]!), qs[i + 1]!),
        );
        const w0: IAutoMovieVector3 = ks[i]!.w!;
        const w1: IAutoMovieVector3 = dexpinv(r1, ks[i + 1]!.w)!;
        q = turn(qs[i]!, {
          x: h10 * span * w0.x + h01 * r1.x + h11 * span * w1.x,
          y: h10 * span * w0.y + h01 * r1.y + h11 * span * w1.y,
          z: h10 * span * w0.z + h01 * r1.z + h11 * span * w1.z,
        });
      }
      return {
        x: x0.map(
          (v: number, k: number): number =>
            h00 * v + h10 * span * d0[k]! + h01 * x1[k]! + h11 * span * d1[k]!,
        ),
        q,
      };
    },
  };
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
     * continuous extension; when absent, the fixed-step classical method,
     * unchanged.
     */
    tolerance?: ITolerance;
  }

  /**
   * A step's accepted error, per component: `absolute + relative × |value|`,
   * the vector state's value the larger of the step's two ends, the
   * orientation's the length of its rotation vector over the step, the
   * error norm the root mean square of the components' error over that.
   */
  export interface ITolerance {
    /** The share of a component's value, non-negative. */
    relative: number;

    /** The component's own unit, non-negative; not both zero. */
    absolute: number;
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

    /**
     * The state at a time, held at the ends outside `[t0, t1]`.
     *
     */
    at: (time: number) => IState;
  }
}
