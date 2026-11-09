import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One meeting of two exposed facades of the same building unit.
 *
 * `exterior` is a corner an observer walks around, and `reentrant` is one an
 * observer walks into. They fail differently: an exterior corner exposes how
 * two elevations join, while a reentrant corner is where an elevation hides
 * itself, which is exactly the face a facade-by-facade sweep leaves unread.
 *
 * Produced by `builtEnvironmentEnvelopeCorners`, sorted by `id`. Non-parallel facade pairs qualify by vertex proximity within the thicker separation plus numeric slack. `position` averages approximately nearest vertex-pair midpoints, which does not prove a shared edge. Pairs with negligible meeting-to-second-centroid direction or negligible first-normal dot product are skipped because the side convention cannot classify them.
 *
 * @evidence contracts/development/design.md#principled-representation Pairs non-parallel facades of one building by vertex proximity, averages approximately nearest pair midpoints and classifies the sign of the first normal toward the second centroid. The side is a one-normal convention, not a test that both bodies lie behind each other's planes or that their geometry intersects.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Carries an id, the building, both facade ids, the kind, a point and an aim direction, which is what a corner observation needs to place a camera, without copying facade geometry the census already holds.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The thicker wall plus `AUTOMOVIE_OBSERVATION_EPSILON` is the shared proximity allowance policy, not a proof of construction error bounds. Degenerate pairs are skipped rather than assigned an arbitrary side.
 * @evidence contracts/development/common.md#meaningful-documentation States the producer, sort/id/pair order, proximity proxy, position fold, side convention and skipped pairs; the normal is the normalized sum of the producer's probe-oriented normals, without an independent global outward guarantee.
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

  /** Normalized sum of the two probe-oriented normals, subject to numerical premises. */
  normal: IAutoMovieVector3;
}
