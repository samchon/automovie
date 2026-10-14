/**
 * Resident anatomical vertices addressed in their immutable source member.
 *
 * Resident vertices retain an ordered bijection to original source ordinals; unused source bookkeeping vertices can be absent. Source arrays and their digest retain their original numbering without welding shading or physical aliases. Omission at the owning qualification denotes identity numbering.
 *
 * @evidence contracts/common.md#principled-implementation Original source population size and ordered resident-to-source ordinals preserve the member's bookkeeping identity after unused vertices are omitted.
 * @evidence contracts/common.md#clear-and-simple-design A count and ordinal vector describe numbering separately from the generic exported accessor intervals.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Ordinal mapping does not weld physical/shading aliases or change the source digest; positivity, range, order and bijection remain reader-enforced invariants.
 * @evidence contracts/common.md#meaningful-documentation The prose distinguishes source population from resident numbering and identifies omission as identity mapping at the owning qualification.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This numbering type performs no vertex compaction or bijection validation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The ordinal schema caches no decoded accessor or source mesh.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type itself allocates no resident vertex buffers or external source handles.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyAssemblySourceVertices {
  /** Complete acquired/authored source vertex population before evaluation. */
  sourceVertexCount: number;

  /** Resident vertex ordinal to the original source vertex ordinal. */
  residentToSource: readonly number[];
}
