import type {
  IAutoMovieIntegrateMotionTrajectory,
  IAutoMovieMotionTrajectoryInterval,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { MotionTrajectoryInterval } from "./MotionTrajectoryInterval";
import { MotionTrajectoryPolynomial } from "./MotionTrajectoryPolynomial";
import { MotionTrajectoryQuaternion } from "./MotionTrajectoryQuaternion";

/*
 * Numeric trajectory readers constructed outside the integration callback's
 * scope.
 */
export namespace MotionTrajectoryRead {
  /*
   * The completed fixed grid's numeric knots, states and endpoint derivatives.
   */
  export interface IFixed {
    /*
     * Interval start, seconds.
     */
    t0: number;

    /*
     * Interval end, seconds.
     */
    t1: number;

    /*
     * Fixed step, seconds.
     */
    h: number;

    /*
     * The scalar knot times, including the shortened final step.
     */
    times: number[];

    /*
     * The vector states at those knots.
     */
    xs: number[][];

    /*
     * The orientations at those knots; null when absent.
     */
    qs: (IAutoMovieQuaternion | null)[];

    /*
     * The vector and angular rates at those knots.
     */
    ks: IAutoMovieIntegrateMotionTrajectory.IRate[];

    /*
     * Whether the trajectory includes an orientation.
     */
    oriented: boolean;
  }

  /*
   * One accepted adaptive step's numeric continuous extension.
   */
  export interface IDenseStep {
    /*
     * Step start, seconds.
     */
    t: number;

    /*
     * Step duration, seconds.
     */
    h: number;

    /*
     * Vector state at the start.
     */
    x: number[];

    /*
     * Four quartic or five paired-quintic correction coefficients per vector
     * component.
     */
    terms: number[][];

    /*
     * Start orientation, null when absent.
     */
    q: IAutoMovieQuaternion | null;

    /*
     * Four quartic or five paired-quintic body-frame rotation-vector
     * coefficients.
     */
    turns: IAutoMovieVector3[];
  }

  /*
   * Read a completed fixed grid by its original cubic Hermite extension.
   */
  export function fixed(
    props: IFixed,
  ): IAutoMovieIntegrateMotionTrajectory.ITrajectory {
    const { t0, t1, h, times, xs, ks }: IFixed = props;
    const steps: number = times.length - 1;
    const quaternion: (time: number) => IAutoMovieQuaternion | null =
      MotionTrajectoryQuaternion.fixed(props);
    return {
      t0,
      t1,
      h,
      times,
      knots: times.length,
      orientation: copied(quaternion),
      interval: (time: number): IAutoMovieMotionTrajectoryInterval => {
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
      at: owned((time: number): IAutoMovieIntegrateMotionTrajectory.IState => {
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

  /*
   * Read accepted quartic or paired-quintic DP5(4) continuous extensions.
   */
  export function dense(
    t0: number,
    t1: number,
    h: number,
    steps: readonly IDenseStep[],
    end: IAutoMovieIntegrateMotionTrajectory.IState,
  ): IAutoMovieIntegrateMotionTrajectory.ITrajectory {
    const times: number[] = [...steps.map((s: IDenseStep): number => s.t), t1];
    const locate: ReturnType<typeof MotionTrajectoryInterval> =
      MotionTrajectoryInterval(t0, t1, steps);
    const quaternion: (time: number) => IAutoMovieQuaternion | null =
      MotionTrajectoryQuaternion.dense(locate, end.q);
    return {
      t0,
      t1,
      h,
      times,
      knots: times.length,
      orientation: copied(quaternion),
      at: owned((time: number): IAutoMovieIntegrateMotionTrajectory.IState => {
        if (!(time < t1)) return { x: end.x, q: quaternion(time) };
        const { step: s, u }: NonNullable<ReturnType<typeof locate>> =
          locate(time)!;
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

  /*
   * Copy the common numeric quaternion projection at every public boundary.
   */
  function copied(
    read: (time: number) => IAutoMovieQuaternion | null,
  ): (time: number) => IAutoMovieQuaternion | null {
    return (time: number): IAutoMovieQuaternion | null => {
      const q: IAutoMovieQuaternion | null = read(time);
      return q === null ? null : { ...q };
    };
  }

  /*
   * Reuse one exact requested time behind the public read boundary. The numeric
   * result may borrow immutable records, but none escapes: each return copies
   * both mutable blocks. Store the key only after a successful read, and
   * distinguish signed zero without changing either reader's branches.
   */
  function owned(
    read: (seconds: number) => IAutoMovieIntegrateMotionTrajectory.IState,
  ): (seconds: number) => IAutoMovieIntegrateMotionTrajectory.IState {
    let previous: number | undefined;
    let value: IAutoMovieIntegrateMotionTrajectory.IState | undefined;
    return (seconds: number): IAutoMovieIntegrateMotionTrajectory.IState => {
      if (value === undefined || !Object.is(seconds, previous)) {
        value = read(seconds);
        previous = seconds;
      }
      return { x: [...value.x], q: value.q === null ? null : { ...value.q } };
    };
  }
}
