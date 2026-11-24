import type { HumanKnot } from "./HumanKnot";
import { prepareHumanAdaptiveKnots } from "./prepareHumanAdaptiveKnots";
import { prepareHumanKnotCourse } from "./prepareHumanKnotCourse";

/**
 * Prepare a value solved in preparation as a knot course over an interval: the
 * interval is split at its marks, the seconds where the value's rule changes (a
 * foot's toe-off or heel strike, where the stance it is solved on changes), and
 * each piece's knots are placed by AutoKnots (Vitenti et al. 2024,
 * arXiv:2412.13423; `prepareHumanAdaptiveKnots`) to the call site's own
 * requirement, so no knot is placed by a fixed rule. A piece's course is the
 * shared minimum-jerk path through its knots (`prepareHumanKnotCourse`, Flash
 * and Hogan 1985, J. Neurosci. 5(7):1688), at rest at its two ends, so no
 * course reaches across a mark. A read takes the piece its second lies in and
 * holds the interval's end values outside it. Marks nearer than `GAP` to each
 * other or to an end are one, and an interval no longer than `GAP` holds the
 * value at its start.
 *
 * @param props The interval, its marks, the value, the tolerance and the knot
 *   limit.
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
  const ends: number[] = [
    from,
    ...(props.marks ?? [])
      .filter((t: number): boolean => t > from + gap && t < to - gap)
      .sort((a: number, b: number): number => a - b)
      .filter(
        (t: number, i: number, all: number[]): boolean =>
          i === 0 || t - all[i - 1]! > gap,
      ),
    to,
  ];
  const pieces: IPiece[] = ends.slice(1).map(
    (end: number, i: number): IPiece => ({
      to: end,
      course: prepareHumanAdaptiveKnots({
        from: ends[i]!,
        to: end,
        evaluate: props.sample,
        tolerance: props.tolerance,
        maxKnots: Math.ceil((end - ends[i]!) / props.step) + 1,
      }).course,
    }),
  );
  return (seconds: number): number[] => {
    const t: number = Math.min(to, Math.max(from, seconds));
    return (
      pieces.find((piece: IPiece): boolean => t <= piece.to) ?? pieces.at(-1)!
    ).course.position(t);
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
     * The seconds the value's rule changes at, each a knot the course is split
     * at; none when absent.
     */
    marks?: readonly number[];

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
     * The finest spacing a piece is knotted at, seconds: the grid the display
     * reads the value on, so a rule that never meets the tolerance (a step
     * inside a piece) stops there.
     */
    step: number;
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

/** One piece of a sampled course, between two of its marks. */
interface IPiece {
  /** The piece's last second. */
  to: number;

  /** Its knot course. */
  course: prepareHumanKnotCourse.ICourse;
}
