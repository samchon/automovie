import { IAutoMovieVector3 } from "@automovie/interface";
import { Vector3 } from "./Vector3";

/**
 * Exact distance between two segments `a→b` and `c→d` (the interior-aware
 * clamped solver, {@link closestSegmentPair}). Shares the closest pair with
 * {@link closestPointsBetweenSegments}, so a contact normal derived from those
 * points always agrees with the distance that flagged the contact.
 *
 * @evidence requirements/motion/contact-weight-and-support.md#motion-contact-authority-tolerance Measures the minimum separation between two bounded contact features.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Measures the minimum separation between two bounded contact features.
 * @author Samchon
 */
export const segmentSegmentDistance = (
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
  c: IAutoMovieVector3,
  d: IAutoMovieVector3,
): number => {
  const pair = closestSegmentPair(a, b, c, d);
  return Vector3.length(Vector3.subtract(pair.pointA, pair.pointB));
};
