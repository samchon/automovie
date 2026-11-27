import type { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMoviePhysicalHullFaces } from "../AutoMoviePhysicalHullFaces";
import { physicalHullFacesErode } from "./physicalHullFacesErode";

/*
 * The vertices of a convex hull of a point set shrunk inward by a depth,
 * searching its hull afresh (see `physicalHullFacesErode`).
 * Parameter points: The hull's shape-local points, metres, spanning a volume.
 * Parameter depth: The inward offset, metres; below the hull's `depth` about its
 * centre, so the eroded solid keeps a volume.
 * Returns: The eroded solid's vertices in the points' frame.
 * When the depth leaves no volume.
 */
export function physicalHullErode(
  points: readonly IAutoMovieVector3[],
  depth: number,
): IAutoMovieVector3[] {
  return physicalHullFacesErode(AutoMoviePhysicalHullFaces.build(points), depth);
}
