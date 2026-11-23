import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieEnvelopeFaceAspect } from "./AutoMovieEnvelopeFaceAspect";

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
   * Authored +Z is flipped only when the offset centroid is inside. Off-volume
   * faces and concave outlines can retain an inward direction; see the
   * producer's numerical and geometric premises.
   */
  normal: IAutoMovieVector3;

  /** Area-weighted world centroid of the face outline. */
  centroid: IAutoMovieVector3;

  /** Face outline in world metres, in authored order. */
  vertices: IAutoMovieVector3[];

  /** Authored separation thickness along the face normal, in metres. */
  thickness: number;
}
