import type { HumanKnot } from "./HumanKnot";
import { prepareHumanKnotCourse } from "./prepareHumanKnotCourse";

/**
 * Prepare a knot course through values solved in preparation at given seconds:
 * each knot is the exact value there, a knot passed without stopping, and the
 * course (`prepareHumanKnotCourse`, a minimum-jerk path after Flash and Hogan
 * 1985, J. Neurosci. 5(7):1688) is at rest at its first and last knot and holds
 * their values outside them. Seconds nearer than `GAP` are one knot.
 *
 * @param times The knots' seconds, ascending.
 * @param sample The exact value at a second, read once a knot.
 * @returns The value at a second.
 */
export function prepareHumanSampledCourse(
  times: readonly number[],
  sample: (seconds: number) => readonly number[],
): (seconds: number) => number[] {
  return prepareHumanSampledCourse.through(
    times.map(
      (seconds: number): prepareHumanSampledCourse.IKnot => ({
        seconds,
        position: sample(seconds),
      }),
    ),
  );
}

/** The knots' spacing, the course through given knots and a window's knots. */
export namespace prepareHumanSampledCourse {
  /** The least gap between two knots, seconds: a microsecond. */
  export const GAP: number = 1e-6;

  /** One knot: its second and its exact value there. */
  export interface IKnot {
    /** The knot's second. */
    seconds: number;

    /** The value there. */
    position: readonly number[];
  }

  /**
   * The course through values already solved at their seconds: a knot nearer
   * than `GAP` to the one before is dropped, and a single knot holds its
   * value.
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

  /**
   * A window's two ends and its middle, the knots of a short easing.
   *
   * @param from The window's first second.
   * @param to Its last.
   * @returns Its knot seconds.
   */
  export function window(from: number, to: number): number[] {
    return to > from ? [from, (from + to) / 2, to] : [from];
  }
}
