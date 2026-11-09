import { IAutoMovieVector3 } from "@automovie/interface";

import { closestPointsBetweenSegments } from "./closestPointsBetweenSegments";

/**
 * Minimum separation of bounded segments in one metre coordinate frame.
 * The closest-pair owner supplies both this scalar and the contact-normal
 * witnesses. Its collapsed-segment, finite-arithmetic and binary64 precision
 * contract applies here too. Inputs are unchanged.
 *
 * @evidence contracts/development/implementation.md#principled-implementation The distance comes from the constrained closest pair that also supplies contact witnesses, sharing collapsed-span, scaled arithmetic and finite-refusal semantics.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The scalar adapter preserves the public query while closestPointsBetweenSegments owns numerical branches and deterministic ties.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No second collision epsilon, endpoint approximation or distance formula alters the shared witness calculation.
 * @evidence contracts/development/common.md#meaningful-documentation States metre frame, unchanged inputs, inherited precision/refusals and consistency with contact witnesses.
 * @evidence contracts/development/implementation.md#efficient-algorithms The fixed candidate solver costs constant time; extracting its distance adds no traversal.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One completed witness calculation supplies the distance without independently recomputing another segment formula.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Witness records become unreachable after the scalar returns; no segment pair or collision history is retained.
 */
export const segmentSegmentDistance: (
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
  c: IAutoMovieVector3,
  d: IAutoMovieVector3,
) => number = (
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
  c: IAutoMovieVector3,
  d: IAutoMovieVector3,
): number => closestPointsBetweenSegments(a, b, c, d).distance;
