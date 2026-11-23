import {
  type IAutoMovieSectionPlane,
  IAutoMovieVector3,
} from "@automovie/interface";

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
 */
export const autoMovieSectionPlanesKeepPoint = (
  planes: readonly IAutoMovieSectionPlane[],
  point: IAutoMovieVector3,
): boolean =>
  planes.every(
    (plane: IAutoMovieSectionPlane): boolean =>
      autoMovieSectionPlaneDistance(plane, point) <= 0,
  );
