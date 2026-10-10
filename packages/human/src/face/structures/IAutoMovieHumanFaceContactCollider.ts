/**
 * One rigid collider surface of a face basis's oral contact.
 *
 * Colliders are the dental arches and the globes. `closure` triangles seal
 * each crown at its root ring or a globe at its posterior pole; `reachMetres`
 * is the distance within which an open gum sheet's orientation still tells
 * its sides apart; and `coverMetres` is the thinnest soft tissue that lies
 * over the surface (a lid over a globe; zero, the default, where mucosa meets
 * the surface itself, as lips on teeth).
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceContactCollider {
  /** ID of the rigid collider surface. */
  surface: string;

  /** Flat oriented closure triangles over the surface's resident vertices. */
  closure: number[];

  /** Distance within which an open sheet's orientation separates its sides, in metres. */
  reachMetres: number;

  /** Least covering soft tissue thickness, in metres; omission means zero. */
  coverMetres?: number;
}
