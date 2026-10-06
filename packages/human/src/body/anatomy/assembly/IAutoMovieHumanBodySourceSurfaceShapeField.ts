/** Offline source deformation over one actual anatomical boundary member. */
export interface IAutoMovieHumanBodySourceSurfaceShapeField {
  /** Exact SourcePart surface member ID; no material or bbox correspondence. */
  member: string;
  /** Common-neutral metre displacement triples, aligned with native source vertices. */
  displacements: readonly number[];
  /** Source attachment boundary ordinals held exactly by zero displacement. */
  heldVertices: readonly number[];
}
