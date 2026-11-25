import type { IAutoMovieVector3 } from "@automovie/interface";

import { physicalHullFaces } from "./physicalHullFaces";
import { physicalHullFacesErode } from "./physicalHullFacesErode";

/**
 * The vertices of a convex hull of a point set shrunk inward by a depth,
 * searching its hull afresh (see `physicalHullFacesErode`).
 *
 * @param points The hull's shape-local points, metres, spanning a volume.
 * @param depth The inward offset, metres; below the hull's `depth` about its
 *   centre, so the eroded solid keeps a volume.
 * @returns The eroded solid's vertices in the points' frame.
 * @throws {Error} When the depth leaves no volume.
 */
export function physicalHullErode(
  points: readonly IAutoMovieVector3[],
  depth: number,
): IAutoMovieVector3[] {
  return physicalHullFacesErode(physicalHullFaces(points), depth);
}
