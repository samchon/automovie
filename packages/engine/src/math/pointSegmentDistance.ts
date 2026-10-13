import { IAutoMovieVector3 } from "@automovie/interface";
import { closestPointsBetweenSegments } from "./closestPointsBetweenSegments";
/**
 * Distance in metres from a point to a closed segment in one coordinate frame.
 * Coincident endpoints give point distance without collapsing tiny nonzero spans.
 * The shared segment owner admits finite represented arithmetic and reports
 * rounded witnesses rather than a certified exact separation bound.
 *
 * @evidence contracts/common.md#principled-implementation An exactly collapsed first segment represents the query point in the shared constrained segment minimum, preserving exact zero endpoints and scaled tiny-span arithmetic.
 * @evidence contracts/common.md#clear-and-simple-design The scalar adapter consumes closestPointsBetweenSegments instead of a second squared-length floor and projection formula.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No Number.EPSILON length floor turns short real segments into points; finite-arithmetic failures follow the shared refusal contract.
 * @evidence contracts/common.md#meaningful-documentation States metre coordinates, bounded endpoints, exact collapsed behavior and inherited represented precision/refusals.
 * @evidence contracts/performance.md#efficient-algorithms A fixed candidate set supplies the minimum, keeping the scalar query constant in time and temporary storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Supplying the point twice expresses its geometry without duplicating the projection algorithm; collision calls share no cached result.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The witness pair is temporary and only its distance escapes, with no retained input or collision state.
 */
export const pointSegmentDistance: (point: IAutoMovieVector3, start: IAutoMovieVector3, end: IAutoMovieVector3) => number = (
  point: IAutoMovieVector3,
  start: IAutoMovieVector3,
  end: IAutoMovieVector3,
): number =>
  closestPointsBetweenSegments(point, point, start, end).distance;
