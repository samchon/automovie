/**
 * A screenplay refinement group explains why its children belong together, such
 * as a montage or exchange.
 *
 * RenderScreenplay prints the rationale in brackets before the children.
 * validateScriptTree requires nonblank prose and checks the group's place in
 * the refinement tree.
 */
export interface IAutoMovieGroupPayload {
  /** Nonblank prose explaining the grouping. */
  rationale: string;
}
