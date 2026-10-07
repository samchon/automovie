import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanFaceOcularSurfaceHit } from "./IHumanFaceOcularSurfaceHit";

/**
 * The analytic exterior of one generated eye: the surface every lid part is
 * seated on and measured against.
 *
 * It is the same cap-replaced surface of revolution the optical geometry
 * tessellates. A certified facet-to-patch deviation accompanies that actual
 * geometry; it does not imply inscription. Analytic seating and actual-hull
 * contact remain distinct readings of their declared representations.
 *
 * @evidence contracts/common.md#principled-implementation One closed-form surface serves construction and measurement, so neither depends on the tessellation of the other.
 * @evidence contracts/common.md#clear-and-simple-design Centre, axis, arc and projection queries retain one exterior, with its representation deviation kept separate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Exposes no per-part offset or tolerance.
 * @evidence contracts/common.md#meaningful-documentation States what the surface is, its relation to the emitted hull and its frame.
 * @evidence contracts/modeling.md#shared-boundaries The ocular exterior is the shared boundary of the lids, their tissue and the visible ocular sheets; this is its one definition.
 * @evidence contracts/modeling.md#spatial-conventions Head-frame metres.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines a reference surface, not a part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Carries no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive.
 * @evidenceExclude contracts/modeling.md#rendered-observation Not displayed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The optical profile owner holds the dimensions.
 * @evidenceExclude contracts/anatomy.md#permitted-range The optical profile owner admits the dimensions.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Defines no input.
 *
 * @author Samchon
 */
export interface IHumanFaceOcularSurface {
  /**
   * Centre descriptor of the compiled globe, head-frame metres. This vector
   * is independent of the private query frame; editing it does not move the
   * surface. Construct a new surface to change its placement.
   */
  center: IAutoMovieVector3;

  /**
   * Unit optical-axis descriptor, from the centre towards the corneal apex.
   * This vector is independent of the private query frame; editing it does
   * not rotate the compiled surface.
   */
  axis: IAutoMovieVector3;

  /**
   * Certified actual exterior facet-to-generating-patch deviation, metres.
   * This one-sided bound is neither a hull-inscription proof nor a tissue
   * clearance. Physical contact is read against the actual emitted hull.
   */
  hullDeviationMetres: number;

  /**
   * Arc coordinate of a point on this exterior, measured from the corneal
   * apex along its meridian, metres. Increasing values run away from the
   * optical axis toward the posterior pole; azimuth does not change the
   * coordinate. The caller supplies this surface's actual projected point.
   *
   * @evidence contracts/common.md#principled-implementation Integrates the same cap meridian and sphere continuation that define this exterior.
   * @evidence contracts/common.md#clear-and-simple-design Returns one meridian coordinate independent of azimuth.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Consumes the actual projected point rather than an unrelated head-axis sample.
   * @evidence contracts/common.md#meaningful-documentation States input responsibility, increasing direction and arc origin.
   * @evidence contracts/modeling.md#spatial-conventions Input is head-frame metres and output is meridian arc metres.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
   * @evidenceExclude contracts/modeling.md#parameter-channels Defines no authoring channel.
   * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive.
   * @evidenceExclude contracts/modeling.md#shared-boundaries Reads the existing analytic boundary without creating another join.
   * @evidenceExclude contracts/modeling.md#rendered-observation Numerical coordinate has no separate displayed result.
   * @evidenceExclude contracts/anatomy.md#anatomical-source Adds no clinical acquisition or tissue measurement.
   * @evidenceExclude contracts/anatomy.md#permitted-range The profile owner admits dimensions.
   * @evidenceExclude contracts/anatomy.md#parametric-authority Defines no personal authoring input.
   */
  meridianArc(point: IAutoMovieVector3): number;

  /**
   * Represented exterior foot, outward normal and signed distance with numerical uncertainty.
   * The global metric enclosure does not certify emitted-hull or tissue acceptance.
   *
   * @evidence contracts/common.md#principled-implementation Complete meridian candidates and restricted sphere geometry bound the nearest metric on the cap-replaced solid.
   * @evidence contracts/common.md#clear-and-simple-design One result carries the foot, normal, signed reading and separate numerical uncertainty.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Numerical uncertainty is not added to authored tissue clearance.
   * @evidence contracts/common.md#meaningful-documentation Separates represented metric output from physical acceptance.
   * @evidence contracts/modeling.md#spatial-conventions Point and signed distance are head-frame metres; the normal is a unit direction.
   * @evidence contracts/modeling.md#shared-boundaries Returns correspondence to the same analytic exterior used by seating and tissue geometry.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
   * @evidenceExclude contracts/modeling.md#parameter-channels Defines no authoring channel.
   * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no render primitive.
   * @evidenceExclude contracts/modeling.md#rendered-observation Numerical query has no separate display.
   * @evidenceExclude contracts/anatomy.md#anatomical-source Adds no clinical measurement or physiological assertion.
   * @evidenceExclude contracts/anatomy.md#permitted-range Existing profile and physical admission owners retain their limits.
   * @evidenceExclude contracts/anatomy.md#parametric-authority Does not expose personal sculpting inputs.
   */
  project(point: IAutoMovieVector3): IHumanFaceOcularSurfaceHit;
}
