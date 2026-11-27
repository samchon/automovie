import type { HumanKnot } from "../HumanKnot";
import { prepareHumanKnotCourse } from "./prepareHumanKnotCourse";

/**
 * Place the knots of an expensive vector function adaptively and join them by
 * the shared knot course: AutoKnots (Vitenti, de Simoni, Penna-Lima and Barroso
 * 2024, "AutoKnots: Adaptive Knot Allocation for Spline Interpolation",
 * arXiv:2412.13423), ported from the paper's description.
 *
 * The knots start as six uniform ones over the interval, or fewer where the
 * clock rounds them together, and any required event times. Each sub-interval
 * starts at status zero. Each sweep tests every sub-interval
 * whose status is below `s_conv = 1` at its midpoint `x̄ = (x_i + x_{i+1}) /
 * 2`: the function is evaluated there and the point becomes a knot, splitting
 * the sub-interval; both halves take the status plus one where both of the
 * paper's criteria hold, and keep it otherwise. The criteria, for each
 * component of the function, are the midpoint's interpolation error, `|f(x̄) −
 * f̂(x̄)| < δ(|f(x̄)| + ε)`, and the integral error, `|Ĩ − Î| < δ(|Ĩ| + ε h)`,
 * where Simpson's 1/3 rule gives `Ĩ = h/6 (f(x_i) + 4 f(x̄) + f(x_{i+1}))` and
 * `Î` is the interpolant's own integral over the sub-interval. Every evaluation
 * is a knot; there is no dense grid. Once every sub-interval has converged, the
 * optional refinement pass resets the status of each sub-interval wider than
 * the widths' mean plus `refine_ns` standard deviations and runs the sweeps
 * again, up to `refine` times (the paper recommends one pass at one standard
 * deviation); no sweep adds knots beyond `max_nodes`. A caller may add its own
 * acceptance condition (`IProps.accept`): a sub-interval then converges only
 * where both hold.
 *
 * The interpolant is the shared knot course (`prepareHumanKnotCourse`, the
 * minimum-jerk spline through the knots at their own times, Flash and Hogan
 * 1985), in place of the paper's not-a-knot cubic. Its pieces are quintics, so
 * a sub-interval's integral `Î` is three-point Gauss-Legendre quadrature, exact
 * for them.
 *
 * Two numerical adaptations of the paper: a requirement in the function's own
 * units (a millimetre, a degree) is the criterion `δ(|f| + ε)` in its limit as
 * `δ` tends to zero with `δ ε` held at the requirement (`Tolerance`
 * `absolute`); and the refinement pass resets no sub-interval whose excess over
 * the mean width is within 16 ulps of the interval's length, since widths equal
 * in exact arithmetic differ by rounding alone.
 *
 * @param props The function, its interval, the tolerance and the limits.
 * @returns The knots and their course.
 */
export function prepareHumanAdaptiveKnots(
  props: prepareHumanAdaptiveKnots.IProps,
): prepareHumanAdaptiveKnots.IKnots {
  const knots: prepareHumanAdaptiveKnots.ISeededKnots<undefined> =
    prepareHumanAdaptiveKnots.seeded({
      ...props,
      evaluate: (
        time: number,
      ): prepareHumanAdaptiveKnots.IPoint<undefined> => ({
        values: props.evaluate(time),
        payload: undefined,
      }),
    });
  return { times: knots.times, values: knots.values, course: knots.course };
}
/** Companion types of {@link prepareHumanAdaptiveKnots}. */
export namespace prepareHumanAdaptiveKnots {
  /**
   * AutoKnots where each evaluation is seeded from the knot before it, and a
   * sub-interval converges only where the caller's own condition holds too: a
   * solve whose answer continues its neighbour's (a branch kept, a swivel
   * continued). The initial knots are evaluated in ascending order, each from
   * the one before; a midpoint is evaluated from its sub-interval's first
   * knot.
   *
   * @param props The seeded function, its interval, the tolerance, the extra
   *   condition and the limits.
   * @returns The knots, each with its payload, and their course.
   */
  export function seeded<T>(props: ISeededProps<T>): ISeededKnots<T> {
    const refine: number = props.refine ?? 1;
    const deviations: number = props.deviations ?? 1;
    const limit: number = props.maxKnots ?? Infinity;
    const within = (
      error: number,
      reference: number,
      width: number,
    ): boolean =>
      props.tolerance.kind === "absolute"
        ? error < props.tolerance.absolute * width
        : error <
          props.tolerance.relative *
            (Math.abs(reference) + props.tolerance.scale * width);

    // Keep the exact endpoints and skip indistinguishable interior seconds.
    const grid: number[] = [props.from];
    for (let i: number = 1; i < INITIAL - 1; ++i) {
      const time: number =
        props.from + ((props.to - props.from) * i) / (INITIAL - 1);
      if (time > grid[grid.length - 1]! && time < props.to) grid.push(time);
    }
    grid.push(props.to);
    const times: number[] =
      props.requiredTimes === undefined
        ? grid
        : [
            ...new Set([
              ...grid,
              ...props.requiredTimes.filter(
                (time: number): boolean => props.from < time && time < props.to,
              ),
            ]),
          ].sort((a: number, b: number): number => a - b);

    // Evaluate each knot from the one before, including the required events.
    const points: IPoint<T>[] = [];
    for (const time of times) points.push(props.evaluate(time, points.at(-1)));
    let status: number[] = times.slice(1).map((): number => 0);

    const sweep = (): void => {
      for (;;) {
        const pending: number[] = [];
        status.forEach((s: number, i: number): void => {
          if (s < CONVERGED) pending.push(i);
        });
        if (pending.length === 0 || times.length + pending.length > limit)
          return;
        const course: prepareHumanKnotCourse.ICourse = join(
          times,
          points.map((p: IPoint<T>): readonly number[] => p.values),
        );
        const added: Map<number, ISplit<T>> = new Map();
        for (const i of pending) {
          const a: number = times[i]!;
          const b: number = times[i + 1]!;
          const h: number = b - a;
          const middle: number = (a + b) / 2;
          // A sub-interval binary64 cannot halve any further is as fine as
          // the time itself resolves: it is left converged, unsplit.
          if (middle === a || middle === b) {
            status[i] = CONVERGED;
            continue;
          }
          const point: IPoint<T> = props.evaluate(middle, points[i]);
          const guess: readonly number[] = course.position(middle);
          const integral: readonly number[] = gauss(course, a, b);
          const pass: boolean =
            point.values.every((v: number, c: number): boolean => {
              const simpson: number =
                (h / 6) *
                (points[i]!.values[c]! + 4 * v + points[i + 1]!.values[c]!);
              return (
                within(Math.abs(v - guess[c]!), v, 1) &&
                within(Math.abs(simpson - integral[c]!), simpson, h)
              );
            }) &&
            (props.accept?.(point, points[i]!, points[i + 1]!) ?? true);
          added.set(i, { at: middle, point, pass });
        }
        // Each tested sub-interval split at its midpoint, both halves at the
        // status the test gave.
        const nextTimes: number[] = [times[0]!];
        const nextPoints: IPoint<T>[] = [points[0]!];
        const nextStatus: number[] = [];
        for (let i: number = 0; i < status.length; ++i) {
          const split: ISplit<T> | undefined = added.get(i);
          if (split !== undefined) {
            const s: number = status[i]! + (split.pass ? 1 : 0);
            nextTimes.push(split.at);
            nextPoints.push(split.point);
            nextStatus.push(s, s);
          } else nextStatus.push(status[i]!);
          nextTimes.push(times[i + 1]!);
          nextPoints.push(points[i + 1]!);
        }
        times.splice(0, times.length, ...nextTimes);
        points.splice(0, points.length, ...nextPoints);
        status = nextStatus;
      }
    };

    sweep();
    for (let pass: number = 0; pass < refine; ++pass) {
      const widths: number[] = times
        .slice(1)
        .map((t: number, i: number): number => t - times[i]!);
      const mean: number =
        widths.reduce((sum: number, w: number): number => sum + w, 0) /
        widths.length;
      const spread: number = Math.sqrt(
        widths.reduce(
          (sum: number, w: number): number => sum + (w - mean) * (w - mean),
          0,
        ) / widths.length,
      );
      let reset: boolean = false;
      status = status.map((s: number, i: number): number => {
        // Widths equal in exact arithmetic differ by rounding alone, which
        // resets nothing: the excess must pass the interval's own rounding.
        if (
          widths[i]! - mean > deviations * spread &&
          widths[i]! - mean > ROUNDING * (props.to - props.from)
        ) {
          reset = true;
          return 0;
        }
        return s;
      });
      if (!reset) break;
      sweep();
    }
    const values: (readonly number[])[] = points.map(
      (p: IPoint<T>): readonly number[] => p.values,
    );
    return {
      times,
      values,
      payloads: points.map((p: IPoint<T>): T => p.payload),
      course: join(times, values),
    };
  }

  /** One evaluation: the function's values and what the solve gave besides. */
  export interface IPoint<T> {
    /** The values, one per component. */
    values: readonly number[];

    /** The solve's own result, which seeds the evaluation after it. */
    payload: T;
  }

  /** What seeded knots are placed for (`seeded`). */
  export interface ISeededProps<T> extends Omit<IProps, "evaluate"> {
    /**
     * The function at a time, seeded from the knot before it.
     *
     * @param time The time.
     * @param near The knot the evaluation continues; none for the first.
     * @returns The evaluation.
     */
    evaluate(time: number, near: IPoint<T> | undefined): IPoint<T>;

    /**
     * The caller's own condition on a tested midpoint, besides the paper's.
     *
     * @param middle The midpoint's evaluation.
     * @param left The sub-interval's first knot.
     * @param right Its last.
     * @returns Whether the sub-interval may converge.
     */
    accept?(middle: IPoint<T>, left: IPoint<T>, right: IPoint<T>): boolean;
  }

  /** Seeded knots, each with its payload. */
  export interface ISeededKnots<T> extends IKnots {
    /** Each knot's payload. */
    payloads: readonly T[];
  }
  /** What the knots are placed for. */
  export interface IProps {
    /** The interval's first time. */
    from: number;

    /** The interval's last time, after `from`. */
    to: number;

    /**
     * The function at a time: one value per component, the same count at every
     * time. Each call is a knot.
     *
     * @param time The time.
     * @returns The values.
     */
    evaluate(time: number): readonly number[];

    /** The acceptance tolerance, from the call site's own requirement. */
    tolerance: Tolerance;

    /**
     * Event times inside the interpolation interval, included in the first
     * grid.
     */
    requiredTimes?: readonly number[];

    /** Refinement passes (`refine`); one when absent, as the paper advises. */
    refine?: number;

    /**
     * The standard deviations past the mean width that reset a sub-interval in
     * refinement (`refine_ns`); one when absent, as the paper advises.
     */
    deviations?: number;

    /** The most knots (`max_nodes`); unbounded when absent. */
    maxKnots?: number;
  }

  /**
   * The paper's tolerance: relative `δ` with scale `ε`, or the absolute limit
   * of that criterion as `δ → 0` with `δ ε` held at the bound, where the
   * requirement is in the function's own units (a millimetre, a degree).
   */
  export type Tolerance =
    | { kind: "relative"; relative: number; scale: number }
    | { kind: "absolute"; absolute: number };

  /** The placed knots and their course. */
  export interface IKnots {
    /** The knots' times, ascending. */
    times: readonly number[];

    /** The function's values at the knots. */
    values: readonly (readonly number[])[];

    /** The shared knot course through them. */
    course: prepareHumanKnotCourse.ICourse;
  }
}

/** A tested sub-interval's midpoint knot and whether it passed. */
interface ISplit<T> {
  /** The midpoint. */
  at: number;

  /** The evaluation there. */
  point: prepareHumanAdaptiveKnots.IPoint<T>;

  /** Whether every criterion held there. */
  pass: boolean;
}

/** The paper's initial knot count: the not-a-knot spline's least. */
const INITIAL: number = 6;

/** The relative rounding of a sum of a few doubles: a handful of ulps. */
const ROUNDING: number = 16 * Number.EPSILON;

/** The status a converged sub-interval reaches (`s_conv`). */
const CONVERGED: number = 1;

/** Three-point Gauss-Legendre nodes on [-1, 1] and their weights. */
const NODES: readonly number[] = [-Math.sqrt(3 / 5), 0, Math.sqrt(3 / 5)];
const WEIGHTS: readonly number[] = [5 / 9, 8 / 9, 5 / 9];

/** The shared knot course through the knots at their own times. */
function join(
  times: readonly number[],
  values: readonly (readonly number[])[],
): prepareHumanKnotCourse.ICourse {
  return prepareHumanKnotCourse(
    values.map(
      (position: readonly number[]): HumanKnot.IKnot => ({
        position: [...position],
        dwell: 0,
      }),
    ),
    { kind: "fixed", times: [...times] },
  );
}

/** The course's integral over [a, b], per component. */
function gauss(
  course: prepareHumanKnotCourse.ICourse,
  a: number,
  b: number,
): number[] {
  const half: number = (b - a) / 2;
  const centre: number = (a + b) / 2;
  const at: (readonly number[])[] = NODES.map(
    (node: number): readonly number[] => course.position(centre + half * node),
  );
  return at[0]!.map((_: number, c: number): number =>
    at.reduce(
      (sum: number, p: readonly number[], k: number): number =>
        sum + WEIGHTS[k]! * half * p[c]!,
      0,
    ),
  );
}
