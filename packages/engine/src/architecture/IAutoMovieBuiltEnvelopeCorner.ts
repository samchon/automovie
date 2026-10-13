import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One meeting of two exposed facades of the same building unit.
 *
 * `exterior` is a corner an observer walks around, and `reentrant` is one an
 * observer walks into. They fail differently: an exterior corner exposes how
 * two elevations join, while a reentrant corner is where an elevation hides
 * itself, which is exactly the face a facade-by-facade sweep leaves unread.
 */
export interface IAutoMovieBuiltEnvelopeCorner {
  /** Stable identity built from the two boundary ids in code-unit order. */
  id: string;
  /** Building unit both facades belong to. */
  building: string;
  /** The two boundary ids, in code-unit order. */
  facades: [string, string];
  /** Which side of the envelope the corner turns toward. */
  kind: "exterior" | "reentrant";
  /** World point the two facades meet at. */
  position: IAutoMovieVector3;
  /** Unit bisector of the two outward normals, pointing off the envelope. */
  normal: IAutoMovieVector3;
}
