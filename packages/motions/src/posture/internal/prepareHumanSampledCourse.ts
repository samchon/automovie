import { PreparedHumanIntervals } from "../../perform/internal/PreparedHumanIntervals";
import type { HumanKnot } from "./HumanKnot";
import { prepareHumanAdaptiveKnots } from "./prepareHumanAdaptiveKnots";
import { prepareHumanKnotCourse } from "./prepareHumanKnotCourse";

/**
 * Prepare a value solved in preparation as a knot course over an interval, its
 * knots placed by AutoKnots (Vitenti et al. 2024, arXiv:2412.13423;
 * `prepareHumanAdaptiveKnots`) to the call site's own requirement, so no knot
 * is placed by a fixed rule. Two kinds of second are forced knots: a mark,
 * where a contact changes but the value runs on (a toe-off under a lowering
 * pelvis), which the course passes without stopping; and a break, where the
 * value's own rule changes (a foot's pivot at its toe-off), at which the course
 * is split, so no course reaches across it. AutoKnots fills each stretch
 * between two forced knots, and each piece between two breaks is the shared
 * minimum-jerk path through all its knots (`prepareHumanKnotCourse`, Flash and
 * Hogan 1985, J. Neurosci. 5(7):1688), at rest at its two ends. A read takes
 * the piece its second lies in and holds the interval's end values outside it.
 * Forced knots nearer than `GAP` to each other or to an end are one, and an
 * interval no longer than `GAP` holds the value at its start.
 *
 * @param props The interval, its forced knots, the value, the tolerance and the
 *   knot limit.
 * @returns The value at a second.
 */
export function prepareHumanSampledCourse(
  props: prepareHumanSampledCourse.IProps,
): (seconds: number) => number[] {
  const { from, to }: prepareHumanSampledCourse.IProps = props;
  const gap: number = prepareHumanSampledCourse.GAP;
  if (!(to - from > gap)) {
    const held: readonly number[] = props.sample(from);
    return (): number[] => [...held];
  }
  const inside: (seconds: readonly number[]) => number[] = (
    seconds: readonly number[],
  ): number[] =>
    seconds
      .filter((t: number): boolean => t > from + gap && t < to - gap)
      .sort((a: number, b: number): number => a - b)
      .filter(
        (t: number, i: number, all: number[]): boolean =>
          i === 0 || t - all[i - 1]! > gap,
      );
  const breaks: number[] = [from, ...inside(props.breaks ?? []), to];
  const marks: number[] = inside(props.marks ?? []);
  const pieces: IPiece[] = breaks
    .slice(1)
    .map((end: number, i: number): IPiece => {
      const start: number = breaks[i]!;
      const forced: number[] = [
        start,
        ...marks.filter(
          (t: number): boolean => t > start + gap && t < end - gap,
        ),
        end,
      ];
      const knots: prepareHumanSampledCourse.IKnot[] = [];
      forced.slice(1).forEach((b: number, j: number): void => {
        const a: number = forced[j]!;
        const placed: prepareHumanAdaptiveKnots.IKnots =
          prepareHumanAdaptiveKnots({
            from: a,
            to: b,
            evaluate: props.sample,
            tolerance: props.tolerance,
            maxKnots: prepareHumanSampledCourse.limit(b - a, props.step),
          });
        placed.times.forEach((seconds: number, k: number): void => {
          if (j === 0 || k > 0)
            knots.push({ seconds, position: placed.values[k]! });
        });
      });
      return { to: end, course: prepareHumanSampledCourse.through(knots) };
    });
  const last: IPiece = pieces[pieces.length - 1]!;
  const endAt = (index: number): number => pieces[index]!.to;
  return (seconds: number): number[] => {
    const t: number = Math.min(to, Math.max(from, seconds));
    const index: number = Number.isNaN(t)
      ? pieces.length
      : PreparedHumanIntervals.lowerBound(pieces.length, endAt, t);
    return (pieces[index] ?? last).course(t);
  };
}

/** The course's inputs, its knots' spacing and the course through knots. */
export namespace prepareHumanSampledCourse {
  /** The least gap between two knots, seconds: a microsecond. */
  export const GAP: number = 1e-6;

  /** What a sampled course is prepared from. */
  export interface IProps {
    /** The interval's first second. */
    from: number;

    /** Its last second. */
    to: number;

    /**
     * The seconds a contact changes at while the value runs on, each a knot the
     * course passes without stopping; none when absent.
     */
    marks?: readonly number[];

    /**
     * The seconds the value's own rule changes at, each a knot the course is
     * split at, at rest on both sides; none when absent.
     */
    breaks?: readonly number[];

    /**
     * The exact value at a second, one number per component; each call is a
     * knot.
     *
     * @param seconds The second.
     * @returns The value.
     */
    sample(seconds: number): readonly number[];

    /** The acceptance tolerance, the call site's own requirement. */
    tolerance: prepareHumanAdaptiveKnots.Tolerance;

    /**
     * The finest spacing a stretch is knotted at, seconds (`limit`): the site's
     * own resolution, or the grid the display reads the value on, so a rule
     * that never meets the tolerance (a step inside a stretch) stops there.
     */
    step: number;
  }

  /**
   * The most knots a stretch may take for its spacing to come down to a step
   * and no further: AutoKnots starts from six uniform knots and halves a
   * sub-interval at a time, so its spacings are the stretch's fifth halved `k`
   * times, and the limit is the knots of the fewest halvings that bring that
   * spacing to the step or under it, `5 * 2^k + 1`.
   *
   * @param width The stretch's length, seconds.
   * @param step The finest spacing asked, seconds.
   * @returns The knot limit.
   */
  export function limit(width: number, step: number): number {
    const halvings: number = Math.max(
      0,
      Math.ceil(Math.log2(width / (INITIAL_SPANS * step)) - 1e-9),
    );
    return INITIAL_SPANS * 2 ** halvings + 1;
  }

  /** One knot: its second and its exact value there. */
  export interface IKnot {
    /** The knot's second. */
    seconds: number;

    /** The value there. */
    position: readonly number[];
  }

  /**
   * The course through values already solved at their own seconds, each a
   * physical instant the caller names: a knot nearer than `GAP` to the one
   * before is dropped, and a single knot holds its value.
   *
   * @param knots The knots, their seconds ascending.
   * @returns The value at a second.
   */
  export function through(
    knots: readonly IKnot[],
  ): (seconds: number) => number[] {
    const kept: IKnot[] = knots.filter(
      (knot: IKnot, i: number): boolean =>
        i === 0 || knot.seconds - knots[i - 1]!.seconds > GAP,
    );
    if (kept.length === 1) {
      const held: readonly number[] = kept[0]!.position;
      return (): number[] => [...held];
    }
    const course: prepareHumanKnotCourse.ICourse = prepareHumanKnotCourse(
      kept.map(
        (knot: IKnot): HumanKnot.IKnot => ({
          position: [...knot.position],
          dwell: 0,
        }),
      ),
      {
        kind: "fixed",
        times: kept.map((knot: IKnot): number => knot.seconds),
      },
    );
    return (seconds: number): number[] => course.position(seconds);
  }
}

/** The sub-intervals of AutoKnots' six uniform starting knots. */
const INITIAL_SPANS: number = 5;

/** One piece of a sampled course, between two of its breaks. */
interface IPiece {
  /** The piece's last second. */
  to: number;

  /** Its course through all its knots. */
  course: (seconds: number) => number[];
}
