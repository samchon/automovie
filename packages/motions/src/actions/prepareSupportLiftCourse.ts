import { HumanArmTrajectoryTerms } from "../posture/HumanArmTrajectoryTerms";
import { prepareHumanSampledCourse } from "../posture/prepareHumanSampledCourse";

/**
 * A support interval's root lift over its share, planned once and read by every
 * displayed sample (`prepareSupportInterval`): the lift that clears the held
 * legs of the floor is fitted exactly at knots AutoKnots places over the share
 * (Vitenti et al. 2024, arXiv:2412.13423; `prepareHumanSampledCourse`) to the
 * limb solver's millimetre (`HumanArmTrajectoryTerms.TOLERANCE`), no finer than
 * the share one frame of the display's grid takes, and read between them from
 * the knots' minimum-jerk course (Flash and Hogan 1985). Its interpolation and
 * Simpson integral tests both read each tested middle, so a lift that rises and
 * falls between two knots fails the integral test even where the middle lies
 * on the line through them.
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
  const course: (share: number) => number[] = prepareHumanSampledCourse({
    from: 0,
    to: 1,
    sample: (share: number): number[] => [exact(share)],
    tolerance: {
      kind: "absolute",
      absolute: HumanArmTrajectoryTerms.TOLERANCE / 1000,
    },
    step: least,
  });
  return {
    read: (share: number): number => course(share)[0]!,
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
