/**
 * The measured metric effect of one named endpoint at unit weight.
 *
 * Distances are metres in the basis head frame. They describe the authored
 * displacement field only: a large `peak` says the endpoint moves geometry far,
 * never that the resulting face is anatomically valid, collision free or a
 * likeness of anyone.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceEndpointScale {
  /** Root mean square displacement over every vertex of every surface. */
  displacement: number;
  /** Largest single-vertex displacement magnitude. */
  peak: number;
  /** Vertices the endpoint carries a sparse row for, across all surfaces. */
  vertices: number;
}
