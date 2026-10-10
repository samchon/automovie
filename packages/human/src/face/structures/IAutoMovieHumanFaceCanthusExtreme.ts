/**
 * A canthus defined as an extreme of the joined margin rows: the margin vertex
 * whose final position has the minimum or maximum projection on a head-frame
 * axis.
 *
 * An extreme-type definition follows edits that move which vertex is the
 * corner, so the producer publishes it in place of a fixed vertex whenever
 * such a definition exists.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceCanthusExtreme {
  /** Discriminant of the extreme-type definition. */
  kind: "extreme";

  /** Unit head-frame axis the joined margin rows are projected on. */
  axis: [number, number, number];

  /** Whether the canthus is the minimum or maximum projection. */
  sense: "minimum" | "maximum";
}
