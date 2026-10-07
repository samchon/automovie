/**
 * Resident anatomical vertices addressed in their immutable source member.
 *
 * Only indexed source bookkeeping ordinals can be absent from this table.
 * Source arrays and their digest retain those original ordinals; emitted
 * triangles use this ordered bijection without welding shading or physical
 * aliases. Omission at the owning qualification denotes identity numbering.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyAssemblySourceVertices {
  /** Complete acquired/authored source vertex population before evaluation. */
  sourceVertexCount: number;

  /** Resident vertex ordinal to the original source vertex ordinal. */
  residentToSource: readonly number[];
}
