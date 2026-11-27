import { AutoMovieEnginePlanarHull } from "@automovie/engine";
import type { IAutoMovieHumanLegHull } from "@automovie/interface";

/**
 * The taut tape round a leg section: the perimeter of the convex hull of its
 * points in the section plane (Andrew's monotone chain), which is what a tape
 * measure pulled round the limb reads (`docs/generalization.md`, Tapes).
 */
export namespace AutoMovieHumanLegHull {
  /**
   * The taut girth of planar points.
   *
   * @param points Section points `[x, z]`, mm, in any order.
   * @returns Perimeter of their convex hull, mm; 0 for fewer than three points.
   */
  export function girth(points: IAutoMovieHumanLegHull.GirthPoints): number {
    return points.length < 3
      ? 0
      : AutoMovieEnginePlanarHull.perimeter(points, 0, 1);
  }
}
