/**
 * Reference to a sampled root on the original growth surface.
 *
 * @evidence contracts/common.md#principled-implementation A native triangle ordinal and admitted barycentric weights identify a sampled feature before contact-cap faces are appended.
 * @evidence contracts/common.md#clear-and-simple-design The reference keeps original growth-surface identity independent from posed root coordinates and later nearest-contact queries.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts These are sampler-derived addresses rather than personal authored vertices or a fixed test root.
 * @evidence contracts/common.md#meaningful-documentation The fields document original resident ordering and sampler admission of the triangle's barycentric weights.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This native-reference type performs no feature-support search; the root-boundary resolver interprets its positive weight support.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reference validity follows the original growth-surface correspondence, with no declared reuse after source topology changes.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources One weight array and triangle scalar retain reference metadata only; no compiled proximity reader is owned here.
 *
 * @author Samchon
 */
export interface IHumanFaceHairRootReference {
  /** Original resident triangle ordinal, before contact-cap triangles are appended. */
  triangle: number;

  /** Barycentric weights over that triangle, admitted by the root sampler. */
  weights: readonly number[];
}
