import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One meeting of two exposed facades of the same building unit.
 *
 * `exterior` is a corner an observer walks around, and `reentrant` is one an
 * observer walks into. They fail differently: an exterior corner exposes how
 * two elevations join, while a reentrant corner is where an elevation hides
 * itself, which is exactly the face a facade-by-facade sweep leaves unread.
 *
 * Produced by `builtEnvironmentEnvelopeCorners`, sorted by `id`. Two facades
 * meet when their normals are not parallel and some vertex of one lies within
 * the thicker of the two separations of a vertex of the other; `position` is
 * the mean of the midpoints of the closest such vertex pairs, so it falls at
 * the middle of a shared edge.
 *
 * @author Samchon
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

  /** World point the two facades meet at, in metres. */
  position: IAutoMovieVector3;

  /** Unit bisector of the two outward normals, pointing off the envelope. */
  normal: IAutoMovieVector3;
}
