/**
 * One directed triangle edge that the shared boundary subdivides: its two
 * mesh-vertex endpoints and the inserted boundary vertices, ordered from
 * `from` to `to`.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonEdgeSplit {
  /** Mesh vertex the directed edge leaves. */
  from: number;

  /** Mesh vertex the directed edge reaches. */
  to: number;

  /** Inserted boundary vertices, ordered from `from` to `to`. */
  added: number[];
}
