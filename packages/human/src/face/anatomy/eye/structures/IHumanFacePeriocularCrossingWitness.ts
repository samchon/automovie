/**
 * An existing transverse crossing tied to the emitted and host incidence.
 * Ordinals retain the instrument's first witness per first triangle; they
 * are not a complete-pair count or a clinical interpretation.
 *
 * @evidence contracts/common.md#principled-implementation Retains original crossing ordinals instead of inferring a location from a count.
 * @evidence contracts/common.md#clear-and-simple-design Source correspondence and emitted corners accompany the same witness.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No rejected triangle or witness is removed.
 * @evidence contracts/common.md#meaningful-documentation States the original instrument population and its interpretation boundary.
 * @evidence contracts/modeling.md#spatial-conventions Ordinals and vertex identities are dimensionless and address the actual producer buffers.
 * @evidence contracts/modeling.md#shared-boundaries References the same incidence used by the two offset sheets.
 *
 * @author Samchon
 */
export interface IHumanFacePeriocularCrossingWitness {
  /** First emitted sheet triangle ordinal. */
  triangle: number;
  /** Second emitted sheet triangle ordinal. */
  other: number;
  /** Actual source-host triangle of the first emitted triangle. */
  sourceTriangle: number;
  /** Actual source-host triangle of the second emitted triangle. */
  otherSourceTriangle: number;
  /** First emitted triangle's vertex identities. */
  corners: number[];
  /** Second emitted triangle's vertex identities. */
  otherCorners: number[];
}
