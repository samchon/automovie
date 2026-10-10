/**
 * One face articulation owner's attachment weights continued below the cut
 * onto body-partition vertices of a source generation's neck band.
 *
 * `owner` is a face articulation owner (`jaw`); `rows` are `[bodyVertex,
 * weight]` pairs ascending by body skin vertex, weights in (0, 1]. They are
 * the same field the face surface's own attachment rows carry above the cut,
 * so the owner's rigid motion reaches the band with one definition.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonBandAttachment {
  /** The face articulation owner, such as `jaw`. */
  owner: string;

  /** `[bodyVertex, weight]` pairs ascending by body vertex. */
  rows: number[];
}
