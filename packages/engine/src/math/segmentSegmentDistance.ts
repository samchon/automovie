import type { IAutoMovieVector3 } from "@automovie/interface";

import { closestPointsBetweenSegments } from "./closestPointsBetweenSegments";

/**
 * Minimum separation of bounded segments in one metre coordinate frame.
 * The closest-pair owner supplies both this scalar and the contact-normal
 * witnesses. Its collapsed-segment, finite-arithmetic and binary64 precision
 * contract applies here too. Inputs are unchanged.
 *
 * @evidence requirements/motion/contact-weight-and-support.md#motion-contact-authority-tolerance Measures contact-feature separation using the same closest witnesses as contact-normal consumers.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Consumes one bounded closest-pair calculation rather than maintaining a second separation formula.
 * @author Samchon
 */
export const segmentSegmentDistance = (
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
  c: IAutoMovieVector3,
  d: IAutoMovieVector3,
): number => closestPointsBetweenSegments(a, b, c, d).distance;
