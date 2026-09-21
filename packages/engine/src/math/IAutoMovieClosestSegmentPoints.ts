import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The closest pair of points between segments `a→b` and `c→d`, and their
 * distance.
 *
 * @evidence requirements/motion/contact-weight-and-support.md#motion-contact-authority-tolerance Carries the paired contact witnesses and their shared separation measurement.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Defines the paired geometric witnesses behind a reported contact separation.
 */
export interface IAutoMovieClosestSegmentPoints {
  /**
   * Point on the first segment.
   *
   * @evidence requirements/motion/contact-weight-and-support.md#motion-contact-authority-tolerance Records the closest witness on the first contact feature.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Records the closest witness on the first contact feature.
   */
  pointA: IAutoMovieVector3;
  /**
   * Point on the second segment.
   *
   * @evidence requirements/motion/contact-weight-and-support.md#motion-contact-authority-tolerance Records the closest witness on the second contact feature.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Records the closest witness on the second contact feature.
   */
  pointB: IAutoMovieVector3;
  /**
   * Distance between the two points.
   *
   * @evidence requirements/motion/contact-weight-and-support.md#motion-contact-authority-tolerance Records the separation computed from the two closest contact witnesses.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Records the separation computed from the two closest contact witnesses.
   */
  distance: number;
}
