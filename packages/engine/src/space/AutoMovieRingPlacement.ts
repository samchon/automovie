/**
 * Where a plan point stands relative to one closed ring.
 *
 * @evidence requirements/staging/marks-zones-and-blocking.md#staging-zone-membership `AutoMovieRingPlacement` defines where a plan point stands relative to one closed ring. This ensures membership is judged from a subject footprint rather than a point.
 * @evidence specifications/performance-motion-and-staging/staging-space-state-and-choreography.md#performance-staging-mark-surface-zone-membership `AutoMovieRingPlacement` structures where a plan point stands relative to one closed ring for the system that resolves host-relative support geometry and whole-footprint zone membership.
 */
export type AutoMovieRingPlacement = "outside" | "boundary" | "inside";
