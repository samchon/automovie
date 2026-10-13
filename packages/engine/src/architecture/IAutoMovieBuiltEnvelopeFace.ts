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
 * Produced by `builtEnvironmentEnvelopeFaces`, sorted by boundary id. A
 * boundary with no face, or whose one space does not resolve, yields no
 * record.
 *
 * @evidence contracts/common.md#principled-implementation The outline is placed by the face's own origin and rotation, the centroid is the shoelace area-weighted centroid (the vertex mean when the doubled area is within `1e-6`), and the outward normal flips the authored `+Z` when a 1 mm probe along it lands inside the space.
 * @evidence contracts/common.md#clear-and-simple-design Keeps the authored `kind` beside the derived `aspect`, so a reader sees both while geometry depends only on the derived one.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The probe distance is the documented `AUTOMOVIE_OBSERVATION_PROBE`; a probe landing outside keeps the authored direction, which also covers a face standing off its volume by the wall thickness.
 * @evidence contracts/common.md#meaningful-documentation States the exposure rule, the producer and ordering, how normal, centroid and vertices are derived and in which frame, that the label is untrusted, and the thickness unit.
 * @evidenceExclude contracts/performance.md#cost-and-resources A record owning fresh world vectors; the producer is linear in boundaries and outline vertices plus one containment probe per exposed face, and every call rebuilds the whole list with no per-environment cache.
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

  /** Observation role derived from the outward normal. */
  aspect: AutoMovieEnvelopeFaceAspect;

  /**
   * Unit normal pointing away from the enclosed space.
   *
   * Derived rather than copied. The authored frame states its own outward `+Z`,
   * and a face wound the other way would otherwise put every camera inside the
   * wall it was meant to photograph, so the direction is settled by asking the
   * space which side it is on.
   */
  normal: IAutoMovieVector3;

  /** Area-weighted world centroid of the face outline. */
  centroid: IAutoMovieVector3;

  /** Face outline in world metres, in authored order. */
  vertices: IAutoMovieVector3[];

  /** Authored separation thickness along the face normal, in metres. */
  thickness: number;
}
