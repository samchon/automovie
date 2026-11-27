import type { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieEnginePhysicalHullFaces } from "../AutoMovieEnginePhysicalHullFaces";
import { physicalHullFacesSegment } from "./physicalHullFacesSegment";

/*
 * The parameter of the deepest point of a segment inside a convex hull of a
 * point set, searching its hull afresh (see `physicalHullFacesSegment`).
 * Parameter points: The hull's shape-local points, metres, spanning a volume.
 * Parameter a: The segment's start, at parameter 0, in the same frame.
 * Parameter b: Its end, at parameter 1.
 * Returns: The parameter in [0, 1].
 * When the points span no volume.
 */
export function physicalHullSegment(
  points: readonly IAutoMovieVector3[],
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
): number {
  return physicalHullFacesSegment(AutoMovieEnginePhysicalHullFaces.build(points), a, b);
}
