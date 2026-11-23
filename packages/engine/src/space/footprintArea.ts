import type {
  IAutoMovieFootprint,
  IAutoMovieFootprintRing,
} from "@automovie/interface";

/**
 * Plan area of the region, in square metres: the outer ring less its holes.
 *
 * Validation holds every hole strictly inside the outer ring and apart from
 * every other hole, so the subtraction cannot double-count and the result
 * cannot go negative for a record that passed. An unvalidated one is reported
 * as the arithmetic actually says rather than clamped, because a negative area
 * is a reader-visible symptom and zero would conceal that invalid region.
 */
export const footprintArea: (footprint: IAutoMovieFootprint) => number = (
  footprint: IAutoMovieFootprint,
): number =>
  footprint.holes.reduce(
    (area: number, hole: IAutoMovieFootprintRing): number =>
      area - Math.abs(hole.doubleArea) / 2,
    Math.abs(footprint.outer.doubleArea) / 2,
  );
