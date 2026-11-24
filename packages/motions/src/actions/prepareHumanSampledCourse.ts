import type { HumanKnot } from "../posture/HumanKnot";
import { prepareHumanKnotCourse } from "../posture/prepareHumanKnotCourse";

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
  const at: number[] = times.filter(
    (t: number, i: number): boolean =>
      i === 0 || t - times[i - 1]! > prepareHumanSampledCourse.GAP,
  );
  const course: prepareHumanKnotCourse.ICourse = prepareHumanKnotCourse(
    at.map(
      (t: number): HumanKnot.IKnot => ({ position: [...sample(t)], dwell: 0 }),
    ),
    { kind: "fixed", times: at },
  );
  return (seconds: number): number[] => course.position(seconds);
}

/** The knots' spacing. */
export namespace prepareHumanSampledCourse {
  /** The least gap between two knots, seconds: a microsecond. */
  export const GAP: number = 1e-6;

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
