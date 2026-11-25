import type {
  IAutoMovieProfilePoint,
  IAutoMovieRegionTriangulation,
} from "@automovie/interface";

import { canonicalRegion } from "./canonicalRegion";
import { trianglesOf } from "./trianglesOf";

/**
 * Validate one planar region, wind it canonically, and ear-clip it, naming the
 * region `label` in any diagnostic.
 *
 * {@link triangulateAutoMovieRegion} calls it with `polygon`, and region
 * extrusion with its own label, so the author learns which region holds a bad
 * ring.
 *
 * @param outer Outer boundary in `x, y` metres, any winding.
 * @param holes Voids inside the outer boundary.
 * @param label Name of the region in diagnostics.
 * @returns The canonical layout with its counter-clockwise triangles.
 * @throws Error with the first ring diagnostic, or when floating-point search
 *   finds no hole bridge or ear.
 */
export const triangulateRegion: (
  outer: readonly IAutoMovieProfilePoint[],
  holes: readonly (readonly IAutoMovieProfilePoint[])[],
  label: string,
) => IAutoMovieRegionTriangulation = (
  outer: readonly IAutoMovieProfilePoint[],
  holes: ReadonlyArray<readonly IAutoMovieProfilePoint[]>,
  label: string,
): IAutoMovieRegionTriangulation => {
  const region: Omit<IAutoMovieRegionTriangulation, "triangles"> =
    canonicalRegion(outer, holes, label);
  return { ...region, triangles: trianglesOf(region) };
};
