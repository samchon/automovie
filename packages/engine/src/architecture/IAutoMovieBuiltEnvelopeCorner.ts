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
 * the middle of a shared edge. A pair whose meeting point coincides with the
 * second facade's centroid, or whose first normal is perpendicular to the
 * direction toward that centroid, is skipped because its side cannot be read.
 *
 * @evidence contracts/common.md#principled-implementation Pairs non-parallel facades of one building, keeps the nearest vertex pairs within the thicker separation plus the observation epsilon, averages their midpoints, and classifies the corner by the sign of the first normal toward the second centroid, negative exactly when each body lies behind the other's outward plane.
 * @evidence contracts/common.md#clear-and-simple-design Carries an id, the building, both facade ids, the kind, a point and an aim direction, which is what a corner observation needs to place a camera, without copying facade geometry the census already holds.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The meeting tolerance is the thicker wall plus `AUTOMOVIE_OBSERVATION_EPSILON`, the construction slack two faces of one corner really have, and degenerate pairs are skipped as documented rather than classified arbitrarily.
 * @evidence contracts/common.md#meaningful-documentation States why exterior and reentrant corners matter, the producer and sort order, the meeting test, how `position` is derived, which degenerate pairs are skipped, the id format and pair order, and that `normal` is a unit bisector pointing off the envelope.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The shape only; finding corners compares every facade pair of a building and every vertex pair between two facades, answered on `builtEnvironmentEnvelopeCorners`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Recomputed from the envelope faces on each call; a census call derives corners once and filters that one list per building.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds strings and two fresh vectors by value, with the caller's corner list as sole owner.
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
