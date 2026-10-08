/**
 * The finite accumulated-area domain refusal of areaWeightedNormals.
 *
 * The existing guard and Error message remain unchanged. A local nonlinear
 * caller can distinguish an undefined candidate normal field from programmer,
 * Source and solver exceptions without matching text or supplying a substitute.
 * Other callers retain ordinary Error compatibility and the inherited name.
 *
 * @evidence contracts/common.md#principled-implementation Names the existing nonfinite accumulated-area condition at its mathematical owner, without changing the condition or any normalization arithmetic.
 * @evidence contracts/common.md#clear-and-simple-design One distinct internal Error class identifies one existing geometric-domain refusal.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The original guard and message remain authoritative; the class provides no fallback normal or relaxed admission.
 * @evidence contracts/common.md#meaningful-documentation Documents the domain, unchanged Error compatibility and the narrow reason for typed discrimination.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping A numerical refusal defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Adds no authoring control.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The refusal carries no spatial value.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Existing indexed normal accumulation retains incidence.
 * @evidenceExclude contracts/modeling.md#rendered-observation A refusal establishes no appearance.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Adds no anatomical quantity.
 * @evidenceExclude contracts/anatomy.md#permitted-range The numerical-domain condition is unchanged.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no anatomy input.
 */
export class HumanMeshNormalDomainError extends Error {
  /** Retain the original finite accumulated-area refusal message and inherited Error name. */
  constructor() {
    super("Model normals require finite accumulated areas.");
  }
}
