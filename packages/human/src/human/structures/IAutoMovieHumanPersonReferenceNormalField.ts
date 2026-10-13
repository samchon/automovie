/**
 * An ancestral shading field built from reference parent areas: the dense per-vertex unit normals of both halves (face, then body; zero for unused vertices), and a lookup of one canonical sample's unit normal under a parent. Normals are dimensionless in the shared Y-up, +Z-forward frame.
 *
 * @evidence contracts/common.md#principled-implementation Dense normals and parent-local sample lookup expose the same ancestral field; unused render vertices read zero while consumed normals are dimensionless unit vectors.
 * @evidence contracts/common.md#clear-and-simple-design One field provides bulk render normals and sparse source queries so transport need not recreate ancestral star accumulation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unused zero entries are explicit storage placeholders, not replacement normals for a used degenerate star.
 * @evidence contracts/common.md#meaningful-documentation The comment states face-before-body order, flat triples, unused zeros and the shared orientation of unit normals.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The dense ancestral normals and sample lookup signature are a type-level representation; their runtime producer owns traversal and allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No request coordinator is implemented by the dense ancestral normals and sample lookup signature; equivalence and invalidation belong to consuming operations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Declaring dense ancestral normals and sample lookup signature acquires no handles or running tasks; the object owner controls ordinary data lifetime.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonReferenceNormalField {
  /** Dense unit normals, face then body, flat triples; zero for unused vertices. */
  normals: number[];

  /**
   * Unit normal of one canonical sample under one parent. The returned triple is borrowed read-only from the field; a zero consumed source normal refuses.
   *
   * @evidence contracts/common.md#principled-implementation Sample and parent select the canonical chart and ancestral domain stars, whose affine interpolation is normalized to a unit vector.
   * @evidence contracts/common.md#clear-and-simple-design Sparse lookup complements the dense face/body normal array without requiring another independent field builder.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A zero consumed source normal refuses rather than returning an arbitrary axis or an unrelated neutral normal.
   * @evidence contracts/common.md#meaningful-documentation The member states unit-normal output, parent-local sample interpretation, borrowed ownership and the zero-normal refusal.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Sparse normal lookup's signature selects no interpolation traversal; the reference-field implementation chooses it.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The field implementation memoizes sample plus weighted binding identity; this member only specifies the read interface.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returned triples are borrowed from the owning field; this callback declaration acquires no separate retention or release obligation.
   */
  at: (sample: number, parent: number) => readonly number[];
}
