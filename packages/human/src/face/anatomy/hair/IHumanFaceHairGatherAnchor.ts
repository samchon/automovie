import type { IHumanFaceHairGatherAttachment } from "./IHumanFaceHairGatherAttachment";

/**
 * Derived scalp attachment selected by the neutral angular ray and carried to the current face. Point is current head-frame metres; triangle is the original source triangle ordinal. Barycentric weights retain the neutral hit for current transport, not a personal authoring coordinate.
 *
 * @evidence contracts/common.md#principled-implementation Neutral barycentric weights preserve a selected source triangle's attachment when evaluated on corresponding current scalp vertices.
 * @evidence contracts/common.md#clear-and-simple-design Extending the point/triangle attachment adds only the neutral weights needed for transport, leaving graph consumers with the smaller base type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The anchor is derived from a neutral angular ray, with no personal authored vertex or separately optimized scalp registration.
 * @evidence contracts/common.md#meaningful-documentation The documentation fixes current head metres, original triangle ordinal and neutral source-corner weight order.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This transported-anchor type performs no ray search or barycentric interpolation; resolveHumanFaceHairGatherAnchor owns that work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Weights identify the same native triangle under current correspondence; changed source geometry invalidates their meaning at the basis owner.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The anchor retains one point and a fixed three-weight tuple, without owning a compiled scalp graph.
 *
 * @author Samchon
 */
export interface IHumanFaceHairGatherAnchor extends IHumanFaceHairGatherAttachment {
  /** Neutral barycentric weights in source-corner order. */
  weights: [number, number, number];
}
