import type { IAutoMovieVector3 } from "@automovie/interface";

import { closestPointsBetweenSegments } from "./closestPointsBetweenSegments";

/**
 * Minimum separation of bounded segments in one metre coordinate frame.
 * The closest-pair owner supplies both this scalar and the contact-normal
 * witnesses. Its collapsed-segment, finite-arithmetic and binary64 precision
 * contract applies here too. Inputs are unchanged.
 *
 * @author Samchon
 */
export const segmentSegmentDistance = (
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
  c: IAutoMovieVector3,
  d: IAutoMovieVector3,
): number => closestPointsBetweenSegments(a, b, c, d).distance;
