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
 * @evidence contracts/common.md#principled-implementation Detects a meeting by the closest vertex pairs of two non-parallel facades within the thicker separation plus `AUTOMOVIE_OBSERVATION_EPSILON`, and classifies it by the sign of one facade's outward normal against the direction to the other facade's centroid.
 * @evidence contracts/common.md#clear-and-simple-design Stores both facade ids with the derived point and bisector, so a corner observation can be aimed without reading either face again.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The tolerance is the walls' own thickness, the construction slack two faces of one corner really have; pairs with parallel normals or a turn within epsilon of zero are skipped rather than forced into a kind.
 * @evidence contracts/common.md#meaningful-documentation States the producer and ordering, the meeting rule, how `position`, `kind`, `normal` and `id` are formed, and the order of `facades`.
 * @evidenceExclude contracts/performance.md#cost-and-resources A record owning two fresh vectors and its ids; its producer compares every facade pair and their vertex pairs, O(facades² × vertices²), enumerating cross-building pairs before skipping them, and memoizes nothing.
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
