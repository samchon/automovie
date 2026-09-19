import { IAutoMovieVector3 } from "@automovie/interface";
import { IAutoMovieSectionPlane } from "./IAutoMovieSectionPlane";
import { autoMovieSectionPlaneDistance } from "./autoMovieSectionPlaneDistance";

/**
 * Whether every declared plane keeps this world point.
 *
 * The planes intersect rather than union: a point survives a section only when
 * no plane removes it. That is what `three.js` applies with `clipIntersection`
 * left false, so a point this reports as kept is a point the renderer draws.
 * Unioning them instead would let a second plane restore what the first cut
 * away, and "two cuts" would mean less removed than one.
 *
 * An empty plane list keeps everything, which is what makes "no section" the
 * absence of a declaration rather than a separate mode.
 *
 * @evidence requirements/camera/clipping-occlusion-and-spatial-constraints.md#camera-clipping-range Answers whether the declared cut leaves a world point in the observed half-space.
 * @evidence specifications/camera-light-and-visibility/visibility-and-image-space-observation.md#clv-clipping-clearance-evaluation Applies the optional clipping planes as an intersection of kept half-spaces with the boundary included.
 */
export const autoMovieSectionPlanesKeepPoint = (
  planes: readonly IAutoMovieSectionPlane[],
  point: IAutoMovieVector3,
): boolean =>
  planes.every((plane) => autoMovieSectionPlaneDistance(plane, point) <= 0);
