import { prepareHumanSampledCourse } from "../posture/prepareHumanSampledCourse";

/**
 * A support interval's root lift over its share, planned once and read by every
 * displayed sample (`prepareSupportInterval`): the lift that clears the held
 * legs of the floor is fitted exactly at every knot of the frame grid's share
 * of the interval, its two ends among them, and read between them from a knot
 * course (`prepareHumanSampledCourse`, the minimum-jerk path through the knots
 * after Flash and Hogan 1985). A displayed sample on the grid reads its knot's
 * own fit. A tessellation that stops where a middle lies on the line through
 * its ends misses a lift that rises and falls between them, and a held leg then
 * sank under the floor by what that lift was; the grid has no such blind spot.
 *
 * @param least The share of the interval one frame of the grid takes: the
 *   frame grid's interval over the interval's seconds.
 * @param exact The exact root lift at a share.
 * @returns The course's reader.
 */
export function prepareSupportLiftCourse(
  least: number,
  exact: prepareSupportLiftCourse.Exact,
): prepareSupportLiftCourse.ICourse {
  const count: number = Math.max(1, Math.ceil(1 / least - 1e-9));
  const course: (share: number) => number[] = prepareHumanSampledCourse(
    Array.from({ length: count + 1 }, (_: unknown, k: number): number => k / count),
    (share: number): number[] => [exact(share)],
  );
  return {
    read: (share: number): number =>
      course(Math.min(1, Math.max(0, share)))[0]!,
  };
}

/** Companion types of {@link prepareSupportLiftCourse}. */
export namespace prepareSupportLiftCourse {
  /** The exact root lift at a share of the interval, metres. */
  export type Exact = (share: number) => number;

  /** A planned lift: its reader. */
  export interface ICourse {
    /** The lift at a share, metres, read from the prepared knots. */
    read(share: number): number;
  }
}
