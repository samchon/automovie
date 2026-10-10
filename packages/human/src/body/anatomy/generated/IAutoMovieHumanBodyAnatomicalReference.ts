/**
 * The exact neutral reference rig an anatomical inspection evaluated.
 *
 * The basis names the compiled body basis whose neutral reference supplied the
 * rig centres. Its neutral is not the requested person's skin, and the record
 * is reference provenance, never a registered personal centre.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyAnatomicalReference {
  /** Exact compiled body basis identity of the neutral reference rig. */
  basis: string;

  /** The neutral reference evaluation, not the requested person's skin. */
  evaluation: "neutral-reference";
}
