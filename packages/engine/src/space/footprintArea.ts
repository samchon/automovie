import { IAutoMovieFootprint } from "./IAutoMovieFootprint";

/**
 * Plan area of the region, in square metres: the outer ring less its holes.
 *
 * Validation holds every hole strictly inside the outer ring and apart from
 * every other hole, so the subtraction cannot double-count and the result
 * cannot go negative for a record that passed. An unvalidated one is reported
 * as the arithmetic actually says rather than clamped, because a negative area
 * is a reader-visible symptom and a zero is a lie.
 *
 * @evidence requirements/staging/marks-zones-and-blocking.md#staging-zone-membership `footprintArea` produces plan area of the region, in square metres: the outer ring less its holes. This ensures membership is judged from a subject footprint rather than a point.
 * @evidence specifications/performance-motion-and-staging/staging-space-state-and-choreography.md#performance-staging-mark-surface-zone-membership `footprintArea` performs area calculation when the engine resolves host-relative support geometry and whole-footprint zone membership.
 */
export const footprintArea = (footprint: IAutoMovieFootprint): number =>
  footprint.holes.reduce(
    (area, hole) => area - Math.abs(hole.doubleArea) / 2,
    Math.abs(footprint.outer.doubleArea) / 2,
  );
