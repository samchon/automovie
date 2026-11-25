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
 * A trajectory planned once and read by time: the solution of `dx/dt = f(t, x)`
 * from `t0` to `t1` by classical fourth-order Runge-Kutta at a fixed step, its
 * knots kept with their derivatives and read between them by cubic Hermite
 * interpolation.
 *
 * The step count is `ceil((t1 - t0) / h)`, the last step shortened to land on
 * `t1` exactly. A state may carry an orientation block, a unit quaternion
 * advanced on the exponential map by the body-frame angular velocity `f`
 * returns, by the fourth-order Runge-Kutta-Munthe-Kaas method: each stage turns
 * the step's start orientation by a rotation vector built from the earlier
 * stages, each stage's body rate is carried to that vector's derivative by the
 * inverse differential of the exponential, and the step turns the start by the
 * stages' weighted vector, renormalised at each knot. Between knots the vector
 * is the cubic Hermite of the two knots' values and derivatives, exact at knots
 * and C1 between; the orientation is the start knot turned by the cubic Hermite
 * of the rotation vector to the end knot, matching both knots' body rates, so a
 * rate read between knots is the motion's and not the step's mean. Reads
 * outside `[t0, t1]` hold the nearer end.
 *
 * Given a `tolerance`, Dormand-Prince 5(4) controls its existing endpoint RMS
 * estimate. Its default continuous extension is quartic; orientation slopes at
 * both ends use the exact right exponential Jacobian. An explicit
 * `rotationDefect` additionally builds the paired quintic continuous extensions
 * of Enright and Hayes and checks their actual body angular velocities in the
 * caller's physical units. The maximum of the existing RMS and physical
 * estimate controls the same step controller. These sampled estimates are not
 * continuous or global-error certificates for an arbitrary pure callback.
 *
 * The output depends on the numeric inputs, pure `f` and optional pure defect
 * callback, never on playback times or order. The default fixed step is a
 * sixtieth of a second; a stiff RHS needs a smaller fixed step or adaptive
 * control. Optional orientation-only playback reads the same solved quaternion
 * without vector interpolation or vector copying, and still returns a fresh
 * quaternion. The caller supplies finite numeric state and rate components.
 * This wrapper checks vector lengths and the presence of an angular rate for an
 * oriented state; it does not validate the components of x0, dx or w for
 * finiteness.
 *
 * @param props The right-hand side, the start state, the interval and the step.
 * @returns The trajectory.
 * @throws {Error} When interval, step, tolerance, partition, failure scope or
 *   defect-mode combination is invalid, a fixed step's count over the interval
 *   is not a safe integer, the state is empty, required rate shape is missing,
 *   a defect is negative/NaN, adaptive refinement reaches time resolution, or
 *   adaptive stepping needs more than DOPRI5's default maximum of 100000 step
 *   attempts. Errors from the pure physical model propagate unchanged.
 */
export function integrateMotionTrajectory(
  props: IAutoMovieIntegrateMotionTrajectory.IProps,
): IAutoMovieIntegrateMotionTrajectory.ITrajectory {
  const h: number = props.h ?? integrateMotionTrajectory.STEP;
  const { t0, t1 } = props;
  if (!(t1 > t0))
    throw new Error(
      `integrateMotionTrajectory: the interval ${t0} to ${t1} is not finite and forward`,
    );
  if (!(h > 0))
    throw new Error(`integrateMotionTrajectory: the step ${h} is not positive`);
  const n: number = props.x0.length;
  const oriented: boolean = props.q0 !== undefined;
  if (
    props.rotationDefect !== undefined &&
    (!oriented || props.tolerance === undefined)
  )
    throw new Error(
      "Continuous rotation-defect control requires an orientation and adaptive tolerance",
    );
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
    if (!(relative >= 0 && absolute >= 0 && relative + absolute > 0))
      throw new Error(
        `integrateMotionTrajectory: the tolerance ${relative} relative and ${absolute} absolute is not finite, non-negative and non-zero`,
      );
    const blocks: readonly number[] | undefined = props.tolerance.blocks;
    if (blocks !== undefined) {
      let dimensions: number = 0;
      let valid: boolean = true;
      for (const width of blocks) {
        if (width <= 0) {
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
  const add: (x: number[], k: readonly number[], s: number) => number[] = (
    x: number[],
    k: readonly number[],
    s: number,
  ): number[] =>
    x.length === 0 ? x : x.map((v: number, i: number): number => v + s * k[i]!);

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

  // A step so fine that the count passes 2^53 (Infinity for a subnormal
  // step over a whole second) leaves a grid no index counts exactly.
  if (steps > Number.MAX_SAFE_INTEGER)
    throw new Error(
      `integrateMotionTrajectory: the step ${h} makes a count of ${steps} steps over the interval, which is not a safe-integer count`,
    );
  const times: number[] = [t0];
  const xs: number[][] = [[...props.x0]];
  const qs: (IAutoMovieQuaternion | null)[] = [
    oriented ? Quaternion.normalize(props.q0!) : null,
  ];
  const ks: IAutoMovieIntegrateMotionTrajectory.IRate[] = [
    retained(t0, xs[0]!, qs[0]!),
  ];
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

/** Companion types and the default step of {@link integrateMotionTrajectory}. */
export namespace integrateMotionTrajectory {
  /**
   * Actual fixed Hermite knot data; the top-level owner documents its units and
   * independent arrays.
   */
  export type IInterval = IAutoMovieMotionTrajectoryInterval;

  /**
   * The default step, seconds: a sixtieth of a second, under which the
   * classical method's error stays far below a millimetre for the motions
   * planned (#3424).
   */
  export const STEP: number = 1 / 60;
}
