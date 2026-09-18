import { IAutoMovieVector3 } from "@automovie/interface";
import { Vector3 } from "./Vector3";
import { IAutoMovieClosestSegmentPoints } from "./IAutoMovieClosestSegmentPoints";

/**
 * Closest points between two segments and their distance, the exact clamped
 * solver ({@link closestSegmentPair}), the same pair
 * {@link segmentSegmentDistance} measures, so a contact normal derived from the
 * pair agrees with the distance that flagged the contact.
 *
 * @evidence requirements/motion/contact-weight-and-support.md#motion-contact-authority-tolerance Returns the two witnesses that explain the measured separation between contact features.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Returns the two witnesses that explain the measured separation between contact features.
 * @author Samchon
 */
export const closestPointsBetweenSegments = (
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
  c: IAutoMovieVector3,
  d: IAutoMovieVector3,
): IAutoMovieClosestSegmentPoints => {
  const pair = closestSegmentPair(a, b, c, d);
  return {
    ...pair,
    distance: Vector3.length(Vector3.subtract(pair.pointA, pair.pointB)),
  };
};
