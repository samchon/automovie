/**
 * Located absence of an analytic derivative; never an acceptance override.
 *
 * @evidence contracts/common.md#principled-implementation Nullable triangle and vertex ownership distinguish whole-face failures from one normal's unavailable derivative without inventing a numeric success value.
 * @evidence contracts/common.md#clear-and-simple-design Carries the location and cause of a missing derivative separately from proposed constraint rows.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A failure describes unavailable modeling data and supplies no replacement direction or acceptance override.
 * @evidence contracts/common.md#meaningful-documentation Documents component-local and original-cut correspondence and the meaning of absent location fields.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Numerical garment data defines no independent part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Carries existing material values without adding an authoring trait.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Computes no new render primitive.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Locations are discrete material indices rather than a physical coordinate or converted measurement.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Retains caller-owned incidence and defines no new geometric join.
 * @evidenceExclude contracts/modeling.md#rendered-observation The actual garment emitter owns rendered verification; local derivatives establish no appearance.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Introduces no anatomical quantity or measured range.
 * @evidenceExclude contracts/anatomy.md#permitted-range The anatomical and field owners retain admission; this operation measures only local orientation.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Internal candidate coordinates are not a public sculpting channel.
 * @author Samchon
 */
export interface IHumanBodyUnderwearLiftDerivativeFailure {
  /** Component-local triangle, or null when a vertex-level normal fails. */
  triangle: number | null;

  /** Component-local vertex, or null when no corner owns the failure. */
  vertex: number | null;

  /** Original cut vertex when a local vertex is available. */
  sourceVertex: number | null;

  /** Actual domain or representability failure that prevented the derivative. */
  reason: string;
}
