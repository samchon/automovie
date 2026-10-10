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
   */
  meridianArc(point: IAutoMovieVector3): number;

  /**
   * Represented exterior foot, outward normal and signed distance with numerical uncertainty.
   * The global metric enclosure does not certify emitted-hull or tissue acceptance.
   */
  project(point: IAutoMovieVector3): IHumanFaceOcularSurfaceHit;
}
