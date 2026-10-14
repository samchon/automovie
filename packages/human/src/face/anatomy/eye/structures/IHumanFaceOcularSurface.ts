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
 *
 * @evidence contracts/common.md#principled-implementation A cap-replaced analytic exterior retains compiled source placement and distinct actual-facet deviation.
 * @evidence contracts/common.md#clear-and-simple-design createHumanFaceOcularSurface owns private queries while independent centre/axis descriptors expose placement without mutating it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Analytic seating does not imply hull inscription or complete physical contact acceptance.
 * @evidence contracts/common.md#meaningful-documentation The prose gives head-frame metres, independent descriptors, projected-point arc premise and numerical uncertainty.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IHumanFaceOcularSurface is an erased geometry/source contract; its concrete producer or reader owns actual algorithms and population traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IHumanFaceOcularSurface declares correspondence only; its concrete owner decides geometry copies, shared readings and invalidation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IHumanFaceOcularSurface acquires no runtime buffer, handle or task; concrete builders/readers own referenced arrays and optional callback retention.
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
   * @evidence contracts/common.md#principled-implementation A projected exterior point names apex-origin meridian distance independently of azimuth.
   * @evidence contracts/common.md#clear-and-simple-design The concrete exterior reader owns cap integration and sphere arc continuation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The caller supplies this surface's projected point; arbitrary points do not independently prove arc correspondence.
   * @evidence contracts/common.md#meaningful-documentation The method states metre distance and direction toward the posterior pole.
   * @evidenceExclude contracts/performance.md#efficient-algorithms IHumanFaceOcularSurface.meridianArc is an erased geometry/source contract; its concrete producer or reader owns actual algorithms and population traversal.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work IHumanFaceOcularSurface.meridianArc declares correspondence only; its concrete owner decides geometry copies, shared readings and invalidation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IHumanFaceOcularSurface.meridianArc acquires no runtime buffer, handle or task; concrete builders/readers own referenced arrays and optional callback retention.
   */
  meridianArc(point: IAutoMovieVector3): number;

  /**
   * Represented exterior foot, outward normal and signed distance with numerical uncertainty.
   * Uncertainty covers represented meridian inputs and profile evaluation;
   * it does not enclose frame reduction, world placement or returned-distance
   * roundoff, nor certify emitted-hull or tissue acceptance.
   *
   * @evidence contracts/common.md#principled-implementation A query selects a represented foot using complete cap candidates and restricted sphere bounds for represented meridian inputs; frame reduction, world placement and final-distance roundoff remain outside the reported uncertainty.
   * @evidence contracts/common.md#clear-and-simple-design The concrete exterior owner combines exact cap candidate metrics with restricted sphere bounds.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A represented foot is not an exact real minimizer or emitted-hull/tissue admission verdict.
   * @evidence contracts/common.md#meaningful-documentation The method states outward normal, signed distance and separate numerical uncertainty.
   * @evidenceExclude contracts/performance.md#efficient-algorithms IHumanFaceOcularSurface.project is an erased geometry/source contract; its concrete producer or reader owns actual algorithms and population traversal.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work IHumanFaceOcularSurface.project declares correspondence only; its concrete owner decides geometry copies, shared readings and invalidation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IHumanFaceOcularSurface.project acquires no runtime buffer, handle or task; concrete builders/readers own referenced arrays and optional callback retention.
   */
  project(point: IAutoMovieVector3): IHumanFaceOcularSurfaceHit;
}
