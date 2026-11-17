import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { MotionTrajectoryPolynomial } from "./MotionTrajectoryPolynomial";
import { MotionTrajectoryInterval } from "./MotionTrajectoryInterval";
import { MotionTrajectoryQuaternion } from "./MotionTrajectoryQuaternion";
import type { integrateMotionTrajectory } from "./integrateMotionTrajectory";

/**
 * Numeric trajectory readers constructed outside the integration callback's scope.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Fixed Hermite and adaptive quartic or paired-quintic reads share held endpoints, fresh public records and a quaternion-only projection.
 * @evidence contracts/development/design.md#principled-representation A completed trajectory owns numeric states and interpolation coefficients; every returned vector and orientation belongs to its read, and the reader has no right-hand side, model or shape-history input.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two existing steppers each hand their completed numeric records to their corresponding reader.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The data records reuse the integrator's state/rate types; no motion is approximated anew or reintegrated at playback.
 */
export namespace MotionTrajectoryRead {
  /**
   * The completed fixed grid's numeric knots, states and endpoint derivatives.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Members distinguish seconds, vector states, unit orientations and their endpoint rates.
   * @evidence contracts/development/design.md#principled-representation Parallel arrays describe the same completed knots, with a shortened final interval and a null quaternion for an absent orientation; the builder owns equal lengths and forward times.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Produced by integrateMotionTrajectory and consumed by its full and quaternion-only numeric readers; no right-hand side or physical model is carried into playback.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the integrator's rate type and stores actual computed knots, without a second curve or fitted result.
   */
  export interface IFixed {
    /** Interval start, seconds. */
    t0: number;

    /** Interval end, seconds. */
    t1: number;

    /** Fixed step, seconds. */
    h: number;

    /** The scalar knot times, including the shortened final step. */
    times: number[];

    /** The vector states at those knots. */
    xs: number[][];

    /** The orientations at those knots; null when absent. */
    qs: (IAutoMovieQuaternion | null)[];

    /** The vector and angular rates at those knots. */
    ks: integrateMotionTrajectory.IRate[];

    /** Whether the trajectory includes an orientation. */
    oriented: boolean;
  }

  /**
   * One accepted adaptive step's numeric continuous extension.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Members distinguish step seconds, vector states, quaternion orientation and four quartic or five paired-quintic coefficients.
   * @evidence contracts/development/design.md#principled-representation The accepted continuous extension's start state and coefficients are numeric data; the builder owns their dimensions and positive step length.
   * @evidence contracts/development/design.md#minimal-and-owned-surface MotionTrajectoryDense constructs records for MotionTrajectoryStepper to accept, and full and quaternion-only readers own the accepted records until playback is released.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No callback, body, history or second interpolation representation is stored in a completed step.
   */
  export interface IDenseStep {
    /** Step start, seconds. */
    t: number;

    /** Step duration, seconds. */
    h: number;

    /** Vector state at the start. */
    x: number[];

    /** Four quartic or five paired-quintic correction coefficients per vector component. */
    terms: number[][];

    /** Start orientation, null when absent. */
    q: IAutoMovieQuaternion | null;

    /** Four quartic or five paired-quintic body-frame rotation-vector coefficients. */
    turns: IAutoMovieVector3[];
  }

  /**
   * Read a completed fixed grid by its original cubic Hermite extension.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Reads numeric knots in seconds, holds ends and returns independent states/orientations; interval copies adjacent fixed states and rates for finite query seconds, selecting end intervals outside the span.
   * @evidence contracts/development/implementation.md#principled-implementation Cubic Hermite of states and of the endpoint rotation vector; exact Jr^-1 maps the endpoint body rate to its coordinate derivative, so both knot body rates match without the construction stepper's truncated-differential error.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Find the interval by division, form the four Hermite weights, then read vector and orientation blocks. The last queried interval owns its time-independent rotation-vector endpoint and endpoint differential.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps fixed knots, vector arithmetic and Hermite weights, and never reads the right-hand side; the exact orientation endpoint slope is the stated C1 correction.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant-time interval lookup and O(n+1) interpolation/output for n components; interval snapshots copy four O(n) arrays without interpolation or RHS work. An immediately repeated full-state time skips interpolation while still issuing independent output.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares completed knot arrays, one previous full state and one common quaternion projection only when Object.is matches each reader's raw requested time. Vector components share each Hermite slope weight times the interval span with its original association. One previous oriented interval shares its relative rotation vector and exact endpoint differential. Full and projected reads use the same quaternion curve.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains numeric knots and bounded last-state/quaternion/interval metadata, without a model callback or history. State outputs and all four interval arrays are fresh. Quaternion-only playback skips vector work but retains numeric knot records.
   */
  export function fixed(props: IFixed): integrateMotionTrajectory.ITrajectory {
    const { t0, t1, h, times, xs, ks }: IFixed = props;
    const steps: number = times.length - 1;
    const quaternion: (time: number) => IAutoMovieQuaternion | null = MotionTrajectoryQuaternion.fixed(props);
    return {
      t0,
      t1,
      h,
      times,
      knots: times.length,
      orientation: copied(quaternion),
      interval: (time: number): integrateMotionTrajectory.IInterval => {
        const t: number = Math.max(t0, Math.min(t1, time));
        const i: number = Math.min(steps - 1, Math.floor((t - t0) / h));
        return {
          from: times[i]!,
          to: times[i + 1]!,
          start: xs[i]!.slice(),
          end: xs[i + 1]!.slice(),
          first: ks[i]!.dx.slice(),
          last: ks[i + 1]!.dx.slice(),
        };
      },
      at: owned((time: number): integrateMotionTrajectory.IState => {
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
        const slope0: number = h10 * span;
        const slope1: number = h11 * span;
        const x0: number[] = xs[i]!;
        const x1: number[] = xs[i + 1]!;
        const d0: readonly number[] = ks[i]!.dx;
        const d1: readonly number[] = ks[i + 1]!.dx;
        return {
          x:
            x0.length === 0
              ? x0
              : x0.map(
                  (v: number, k: number): number =>
                    h00 * v + slope0 * d0[k]! + h01 * x1[k]! + slope1 * d1[k]!,
                ),
          q: quaternion(time),
        };
      }),
    };
  }

  /**
   * Read accepted quartic or paired-quintic DP5(4) continuous extensions.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Reads numeric dense coefficients in seconds, holds the endpoints and returns caller-owned vector and orientation records.
   * @evidence contracts/development/implementation.md#principled-implementation Evaluates the accepted four-coefficient quartic or five-coefficient paired quintic through the common scalar polynomial and body exponential. The full and projected quaternion paths share one curve owner.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Binary-search the accepted interval and evaluate its vector and rotation polynomials.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Playback consumes only the accepted extension; no shape samples, extra integration or second quaternion interpolation enter it.
   * @evidence contracts/development/implementation.md#efficient-algorithms For A steps and n states a new time costs O(log A+n+1), including interpolation and output copying; an immediately repeated exact time skips lookup and interpolation but still copies O(n+1) output components. Retention is O(A(n+1)), plus one numeric read.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Dense coefficients are shared by every read; one previous full state and one common quaternion projection reuse polynomial work only for Object.is-equal raw requested times. The full read and its quaternion additionally share the exact same interval/share, avoiding a duplicate search and division. Quaternion-only reads skip all vector interpolation and copying.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains accepted numeric steps, the endpoint, one previous full state, one previous projected quaternion and one previous interval/share. Every public vector and orientation is fresh; builder props and the right-hand side are outside this factory's scope. Quaternion-only playback still owns the accepted vector coefficients; it changes computation, not their storage lifetime.
   */
  export function dense(
    t0: number,
    t1: number,
    h: number,
    steps: readonly IDenseStep[],
    end: integrateMotionTrajectory.IState,
  ): integrateMotionTrajectory.ITrajectory {
    const times: number[] = [...steps.map((s: IDenseStep): number => s.t), t1];
    const locate: ReturnType<typeof MotionTrajectoryInterval> = MotionTrajectoryInterval(t0, t1, steps);
    const quaternion: (time: number) => IAutoMovieQuaternion | null = MotionTrajectoryQuaternion.dense(locate, end.q);
    return {
      t0,
      t1,
      h,
      times,
      knots: times.length,
      orientation: copied(quaternion),
      at: owned((time: number): integrateMotionTrajectory.IState => {
        if (!(time < t1)) return { x: end.x, q: quaternion(time) };
        const { step: s, u }: NonNullable<ReturnType<typeof locate>> = locate(time)!;
        return {
          x:
            s.x.length === 0
              ? s.x
              : s.x.map(
                  (v: number, c: number): number =>
                    v +
                    MotionTrajectoryPolynomial.value(
                      u,
                      s.terms[c]![0]!,
                      s.terms[c]![1]!,
                      s.terms[c]![2]!,
                      s.terms[c]![3]!,
                      s.terms[c]![4],
                    ),
                ),
          q: quaternion(time),
        };
      }),
    };
  }

  /** Copy the common numeric quaternion projection at every public boundary. */
  function copied(read: (time: number) => IAutoMovieQuaternion | null): (time: number) => IAutoMovieQuaternion | null {
    return (time: number): IAutoMovieQuaternion | null => {
      const q: IAutoMovieQuaternion | null = read(time);
      return q === null ? null : { ...q };
    };
  }

  /**
   * Reuse one exact requested time behind the public read boundary. The
   * numeric result may borrow immutable records, but none escapes: each return
   * copies both mutable blocks. Store the key only after a successful read,
   * and distinguish signed zero without changing either reader's branches.
   */
  function owned(
    read: (seconds: number) => integrateMotionTrajectory.IState,
  ): (seconds: number) => integrateMotionTrajectory.IState {
    let previous: number | undefined;
    let value: integrateMotionTrajectory.IState | undefined;
    return (seconds: number): integrateMotionTrajectory.IState => {
      if (value === undefined || !Object.is(seconds, previous)) {
        value = read(seconds);
        previous = seconds;
      }
      return { x: [...value.x], q: value.q === null ? null : { ...value.q } };
    };
  }
}
