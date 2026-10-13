import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieSectionPlane } from "./IAutoMovieSectionPlane";
import { autoMovieSectionPlaneDistance } from "./autoMovieSectionPlaneDistance";

/**
 * Whether every declared section plane keeps this world point.
 *
 * The planes intersect rather than union: a point survives only when no plane
 * removes it, and a point exactly on a plane is kept. That is what `three.js`
 * applies with `clipIntersection` false, which the viewer's
 * `applyAutoMovieSectionPlanes` writes explicitly, so a point this reports as
 * kept is a point the renderer draws. A union would let a second plane restore
 * what the first cut away.
 *
 * An empty plane list keeps everything, which makes "no section" the absence of
 * a declaration rather than a separate mode. A degenerate plane throws the
 * `RangeError` of {@link autoMovieSectionPlaneDistance} when it is reached;
 * evaluation stops at the first plane that removes the point.
 *
 * @evidence contracts/common.md#principled-implementation The kept region of several half-space cuts is the intersection of their closed kept sides, so the point is tested with `every` over `autoMovieSectionPlaneDistance(plane, point) <= 0`, reusing the single boundary rule rather than restating it.
 * @evidence contracts/common.md#clear-and-simple-design One predicate over the list, delegating all plane arithmetic and refusal to the distance function, so the point test, the box classifier and the viewer share one sign convention.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No plane order, axis or plane count is special-cased, and an empty list is the natural identity of `every` rather than a separate branch.
 * @evidence contracts/common.md#meaningful-documentation States the intersection semantics and why, the boundary rule, the agreement with the viewer's clipping setting, the empty-list meaning, and when a degenerate plane throws given the early exit.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the number of planes with constant work each, stopping at the first plane that removes the point; nothing is allocated.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure predicate per point with no coordination across calls or consumers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains neither the plane list nor the point after returning.
 */
export const autoMovieSectionPlanesKeepPoint = (
  planes: readonly IAutoMovieSectionPlane[],
  point: IAutoMovieVector3,
): boolean =>
  planes.every(
    (plane: IAutoMovieSectionPlane): boolean =>
      autoMovieSectionPlaneDistance(plane, point) <= 0,
  );
