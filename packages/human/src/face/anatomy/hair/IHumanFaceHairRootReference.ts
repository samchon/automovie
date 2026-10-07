/**
 * Reference to a sampled root on the original growth surface.
 *
 * @evidence contracts/common.md#principled-implementation Original face ordinal and barycentric weights identify a source seat independently of current deformation.
 * @evidence contracts/common.md#clear-and-simple-design Two sampling references are shared by seating and boundary lookup rather than redeclared independently.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A current position is derived from source incidence, not substituted for the original seat.
 * @evidence contracts/common.md#meaningful-documentation States original addressing and the sampler's weight admission responsibility.
 * @evidence contracts/modeling.md#spatial-conventions Triangle ordinal and barycentric weights are dimensionless source references.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The source producer owns strand identity.
 * @evidenceExclude contracts/modeling.md#parameter-channels This derived reference is not an authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The sampler emits the root population.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The boundary resolver consumes this reference.
 * @evidenceExclude contracts/modeling.md#rendered-observation The assembled hair consumer observes results.
 * @evidenceExclude contracts/anatomy.md#anatomical-source These numerical references establish no biological follicle location.
 * @evidenceExclude contracts/anatomy.md#permitted-range The sampler admits weights and this record admits no biological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority References are derived from shared source rather than authored personal vertices.
 *
 * @author Samchon
 */
export interface IHumanFaceHairRootReference {
  /** Original resident triangle ordinal, before contact-cap triangles are appended. */
  triangle: number;

  /** Barycentric weights over that triangle, admitted by the root sampler. */
  weights: readonly number[];
}
