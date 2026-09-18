import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One hull boundary edge and the point's distance to it.
 *
 * @evidence requirements/motion/contact-weight-and-support.md#motion-contact-authority-tolerance Carries the nearest support edge and residual used to explain an unstable placement.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Defines the edge witness returned by support-polygon contact measurements.
 */
export interface IAutoMovieHullEdge {
  /**
   * First endpoint of the hull edge.
   *
   * @evidence requirements/motion/contact-weight-and-support.md#motion-contact-authority-tolerance Identifies the first endpoint of the support edge that bounds the stability result.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Identifies the first endpoint of the support edge that bounds the stability result.
   */
  start: IAutoMovieVector3;
  /**
   * Second endpoint of the hull edge.
   *
   * @evidence requirements/motion/contact-weight-and-support.md#motion-contact-authority-tolerance Identifies the second endpoint of the support edge that bounds the stability result.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Identifies the second endpoint of the support edge that bounds the stability result.
   */
  end: IAutoMovieVector3;
  /**
   * Shortest planar distance from the query point to this edge.
   *
   * @evidence requirements/motion/contact-weight-and-support.md#motion-contact-authority-tolerance Records the measured residual from the query point to the support boundary.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Records the measured residual from the query point to the support boundary.
   */
  distance: number;
}
