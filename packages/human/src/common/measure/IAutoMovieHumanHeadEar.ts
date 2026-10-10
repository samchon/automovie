/**
 * One ear as a head rule leaves it out of a search: the head view triangles
 * that touch the declared ear area, and the area's highest point at rest
 * (`humanHeadEar`).
 *
 * @author Samchon
 */
export interface IAutoMovieHumanHeadEar {
  /** Ordinals of the head view triangles with a vertex in the ear area. */
  triangles: Set<number>;

  /** Highest ear-area vertex height at rest, metres. */
  top: number;
}
