import type {
  IAutoMovieProfilePoint,
  IAutoMovieRegionTriangulation,
} from "@automovie/interface";

import { canonicalRegion } from "./canonicalRegion";
import { trianglesOf } from "./trianglesOf";

/*
 * Validate one planar region, wind it canonically, and ear-clip it, naming the
 * region `label` in any diagnostic.
 *
 * The public triangulator defaults its label to `polygon`, and region extrusion
 * with its own label, so the author learns which region holds a bad ring.
 * Parameter outer: Outer boundary in `x, y` metres, any winding.
 * Parameter holes: Voids inside the outer boundary.
 * Parameter label: Name of the region in diagnostics.
 * Returns: The canonical layout with its counter-clockwise triangles.
 * Error with the first ring diagnostic, or when floating-point search
 * finds no hole bridge or ear.
 */
export function triangulateRegion(
  outer: readonly IAutoMovieProfilePoint[],
  holes: ReadonlyArray<readonly IAutoMovieProfilePoint[]>,
  label: string,
): IAutoMovieRegionTriangulation {
  const region: Omit<IAutoMovieRegionTriangulation, "triangles"> =
    canonicalRegion(outer, holes, label);
  return { ...region, triangles: trianglesOf(region.points, region.rings) };
}
