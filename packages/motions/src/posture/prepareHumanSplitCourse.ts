import { prepareHumanSampledCourse } from "./prepareHumanSampledCourse";

/**
 * Prepare a sampled course split at given seconds: between two neighbouring
 * marks the value is its own knot course (`prepareHumanSampledCourse`) through
 * the knots inside that interval and its two ends, so a quantity whose rule
 * changes at a mark (a foot's pivot at its toe-off or its heel strike) is
 * never joined across it. A read takes the interval its second lies in.
 *
 * @param duration The course's last second; the first is 0.
 * @param marks The seconds the course is split at.
 * @param knots The seconds the value is solved at, ascending.
 * @param sample The exact value at a second, read once a knot.
 * @returns The value at a second.
 */
export function prepareHumanSplitCourse(
  duration: number,
  marks: readonly number[],
  knots: readonly number[],
  sample: (seconds: number) => readonly number[],
): (seconds: number) => number[] {
  const gap: number = prepareHumanSampledCourse.GAP;
  const ends: number[] = [
    0,
    ...marks
      .filter((t: number): boolean => t > gap && t < duration - gap)
      .sort((a: number, b: number): number => a - b)
      .filter(
        (t: number, i: number, all: number[]): boolean =>
          i === 0 || t - all[i - 1]! > gap,
      ),
    duration,
  ];
  const intervals: prepareHumanSplitCourse.IInterval[] = [];
  for (let i: number = 0; i + 1 < ends.length; i++) {
    const from: number = ends[i]!;
    const to: number = ends[i + 1]!;
    intervals.push({
      to,
      course: prepareHumanSampledCourse(
        [
          from,
          ...knots.filter((t: number): boolean => t > from + gap && t < to - gap),
          to,
        ],
        sample,
      ),
    });
  }
  return (seconds: number): number[] =>
    (
      intervals.find(
        (interval: prepareHumanSplitCourse.IInterval): boolean =>
          seconds <= interval.to,
      ) ?? intervals[intervals.length - 1]!
    ).course(seconds);
}

/** One interval of a split course. */
export namespace prepareHumanSplitCourse {
  /** An interval and the course over it. */
  export interface IInterval {
    /** The interval's last second. */
    to: number;

    /** The value over it. */
    course: (seconds: number) => number[];
  }
}
