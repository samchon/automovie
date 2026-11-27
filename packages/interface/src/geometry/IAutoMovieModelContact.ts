/**
 * How two parts of one built model meet, as `measureModelContacts`
 * reports it for every unordered pair of parts.
 *
 * Both parts are measured where they sit in the model's frame, so the gap is in
 * model metres. Identities are the model's own part identities. The record
 * measures a form at rest; it judges nothing, and whether a relation is wanted
 * is the caller's to state, for example in an `IAutoMovieFormExpectation`.
 */
export interface IAutoMovieModelContact {
  /** The pair's part that comes first in model part order. */
  part: string;

  /** The pair's part that comes second in model part order. */
  other: string;

  /**
   * The least Euclidean distance between the two surfaces, in metres, from
   * vertex-to-triangle and edge-to-edge distances; 0 when they cross.
   */
  gap: number;

  /**
   * The share of `part`'s surface area, in [0, 1], whose triangle centroids lie
   * inside `other` by its winding number. One centroid stands for each
   * triangle, so the share resolves at the triangle size.
   */
  inside: number;

  /** The same share of `other`'s surface area inside `part`. */
  otherInside: number;

  /**
   * How the pair meets, the first that applies:
   *
   * - `crossing`: the surfaces pass through each other, transversely or flat in
   *   one plane, by `AutoMovieEngineMeshCrossingQuery.measure` in either
   *   direction;
   * - `contained`: one part lies wholly inside the other, its share being 1;
   * - `touching`: the gap is at most the caller's contact distance;
   * - `apart`: otherwise.
   */
  relation: IAutoMovieModelContact.Relation;
}

/** The relation vocabulary of a model part pair. */
export namespace IAutoMovieModelContact {
  /** How two parts meet, in the order the report tests them. */
  export type Relation = "crossing" | "contained" | "touching" | "apart";
}
