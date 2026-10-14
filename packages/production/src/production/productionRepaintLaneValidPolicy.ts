import { IAutoMovieMixedVisualDeliveryPolicy } from "./IAutoMovieMixedVisualDeliveryPolicy";
import { productionRepaintLaneIsDigest } from "./productionRepaintLaneIsDigest";
import type { IAutoMovieVisualDeliveryTransition } from "./IAutoMovieVisualDeliveryTransition";

/**
 * Match version1 review metadata to the exact directed crossing population. The planner separately compares observation identity. Each transition reviewDigest is checked for SHA-256 spelling only, with no artifact load or independent approval observation.
 *
 * @evidence contracts/common.md#principled-implementation Version/digest admission and equal counts precede index-by-index from/to occurrence comparison and review-digest syntax checks.
 * @evidence contracts/common.md#clear-and-simple-design Crossing correspondence lives here while current observation equality and mixed-policy presence stay with the planner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reordered, missing or extra crossings fail, but syntactically valid review digests remain authored assertions; typed nested records are premises and malformed access may throw.
 * @evidence contracts/common.md#meaningful-documentation Prose states ordered exact matching, split observation responsibility and review artifact limitations.
 * @evidence contracts/performance.md#efficient-algorithms One C-transition pass compares endpoint/digest text; storage is constant beyond supplied crossings and policy arrays.
 * @evidence contracts/performance.md#reuse-equivalent-work The planner's already derived crossing array is consumed directly without rewalking timeline lanes; no verdict cache survives.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No policy, crossing array or review bytes are retained and only a boolean escapes; no observation task starts.
 */
export const productionRepaintLaneValidPolicy: (policy: IAutoMovieMixedVisualDeliveryPolicy, crossings: ReadonlyArray<{
    fromOccurrence: string;
    toOccurrence: string;
}>) => boolean = (
  policy: IAutoMovieMixedVisualDeliveryPolicy,
  crossings: ReadonlyArray<{
    fromOccurrence: string;
    toOccurrence: string;
  }>,
): boolean =>
  policy.version === 1 &&
  productionRepaintLaneIsDigest(policy.observationDigest) &&
  policy.transitions.length === crossings.length &&
  policy.transitions.every(
    (transition: IAutoMovieVisualDeliveryTransition, index: number): boolean =>
      transition.fromOccurrence === crossings[index]?.fromOccurrence &&
      transition.toOccurrence === crossings[index]?.toOccurrence &&
      productionRepaintLaneIsDigest(transition.reviewDigest),
  );
