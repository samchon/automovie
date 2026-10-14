import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieEnvelopeFaceAspect } from "./AutoMovieEnvelopeFaceAspect";

/**
 * One exposed separation of a building unit, placed in world space.
 *
 * A separation is exposed when it encloses exactly one logical space, because
 * the record's other spelling names the two regions a separation stands
 * between. What is left over is the envelope, which is precisely the population
 * a facade, corner, and roof review is counted over.
 *
 * Produced by `builtEnvironmentEnvelopeFaces`, sorted by boundary id in
 * code-unit order. A boundary with no face, with no space or more than one, or
 * whose one space is not in the record yields no record; a space no building
 * unit owns makes the producer throw.
 *
 * @evidence contracts/common.md#principled-implementation Exposure means a declared face separates exactly one declared space. The normal is authored +Z flipped only when a positive-offset centroid probe passes containment; this heuristic does not certify global outward orientation. The shoelace centroid falls back to the vertex mean below the area threshold.
 * @evidence contracts/common.md#clear-and-simple-design Carries identity, owner, authored label, aspect and world geometry together, so the census and the corner finder read one record per face instead of re-deriving world vertices and normals.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Authored `kind` never decides aspect or exposure. The same positive-side containment probe applies to every face; an outside probe preserves the authored direction rather than inventing an orientation certificate.
 * @evidence contracts/common.md#meaningful-documentation States the exposure rule, the producer and its order, when no record is produced and when the producer throws, how the normal is derived and why, the centroid weighting, the vertex order and the metre units.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A data shape; deriving it costs one outline transform, one centroid and one containment probe per boundary, answered on `builtEnvironmentEnvelopeFaces`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call rebuilds the face list from the record; the census and corner finder each call the producer, and nothing stores faces across environments or edits.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Owns fresh vectors and a vertex array per face, released with the caller's list; no field aliases the boundary record.
 * @author Samchon
 */
export interface IAutoMovieBuiltEnvelopeFace {
  /** Boundary whose face this is. */
  boundary: string;

  /** Building unit owning the enclosed space. */
  building: string;

  /** The one logical space this separation encloses. */
  space: string;

  /** Authored boundary label, preserved without being trusted for geometry. */
  kind: string;

  /** Observation role derived from the probe-oriented normal. */
  aspect: AutoMovieEnvelopeFaceAspect;

  /**
   * Normal oriented by the producer's positive-side containment probe.
   *
   * Authored +Z is flipped only when the offset centroid is inside. Off-volume faces and concave outlines can retain an inward direction; see the producer's numerical and geometric premises.
   */
  normal: IAutoMovieVector3;

  /** Area-weighted world centroid of the face outline. */
  centroid: IAutoMovieVector3;

  /** Face outline in world metres, in authored order. */
  vertices: IAutoMovieVector3[];

  /** Authored separation thickness along the face normal, in metres. */
  thickness: number;
}
