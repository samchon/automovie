import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One meeting of two exposed facades of the same building unit.
 *
 * `exterior` is a corner an observer walks around, and `reentrant` is one an
 * observer walks into. They fail differently: an exterior corner exposes how
 * two elevations join, while a reentrant corner is where an elevation hides
 * itself, which is exactly the face a facade-by-facade sweep leaves unread.
 *
 * Produced by `builtEnvironmentEnvelopeCorners`, sorted by `id`. Non-parallel
 * facade pairs qualify by vertex proximity within the thicker separation plus
 * numeric slack. `position` averages approximately nearest vertex-pair
 * midpoints, which does not prove a shared edge. Pairs with negligible
 * meeting-to-second-centroid direction or negligible first-normal dot product
 * are skipped because the side convention cannot classify them.
 */
export interface IAutoMovieBuiltEnvelopeCorner {
  /** Stable identity `"<first facade>+<second facade>"`, in code-unit order. */
  id: string;

  /** Building unit both facades belong to. */
  building: string;

  /** The two boundary ids, in code-unit order. */
  facades: [string, string];

  /** Which side of the envelope the corner turns toward. */
  kind: "exterior" | "reentrant";

  /** Mean of selected vertex-pair midpoints, in world metres. */
  position: IAutoMovieVector3;

  /**
   * Normalized sum of the two probe-oriented normals, subject to numerical
   * premises.
   */
  normal: IAutoMovieVector3;
}
