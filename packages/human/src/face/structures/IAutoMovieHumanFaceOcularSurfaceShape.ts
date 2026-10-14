import type { IPortraitOcularTissueShape } from "../anatomy/eye/structures/IPortraitOcularTissueShape";

/**
 * Coarse medial conjunctival sheet and independently authored upper/lower wet margins.
 *
 * @evidence contracts/common.md#principled-implementation Inherited caruncle/plica/lower-margin dimensions and an optional upper width/lift pair drive buildHumanFaceOcularSurfaces on actual registered lid chains and generated ocular exterior.
 * @evidence contracts/common.md#clear-and-simple-design The canonical constructed-eye shape owns five existing dimensions while these two independent upper-margin fields extend the same millimetre convention.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The consumer requires finite nonnegative dimensions and a complete upper pair; widths are geometrically limited by the actual local aperture and pointwise seating does not prove clearance of intervening faces.
 * @evidence contracts/common.md#meaningful-documentation Optional upper pair requirements and mm relief distinguish source display shape from measured conjunctiva, tear secretion or tissue mechanics.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This extension implements no surface lattice or ocular projection.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Shared dimension ownership is a type relationship, not evaluated-surface caching.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Scalar dimensions create no emitted sheet or display material here.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceOcularSurfaceShape extends IPortraitOcularTissueShape {
  /** Optional upper wet-margin maximum width in mm; requires upperMarginLift. */
  upperMarginWidth?: number;

  /** Upper rounded anterior relief in mm; requires upperMarginWidth. */
  upperMarginLift?: number;
}
