/**
 * Slack, in metres, within which a plan point counts as standing on a ring.
 *
 * A nanometre is exact for authored coordinates while keeping the classifier
 * from flickering across a rim as the last bits of a coordinate move.
 *
 * @evidence requirements/staging/marks-zones-and-blocking.md#staging-zone-membership `FOOTPRINT_EPSILON` fixes slack, in metres, within which a plan point counts as standing on a ring. This ensures membership is judged from a subject footprint rather than a point.
 * @evidence specifications/performance-motion-and-staging/staging-space-state-and-choreography.md#performance-staging-mark-surface-zone-membership `FOOTPRINT_EPSILON` bounds the footprint epsilon policy while the engine resolves host-relative support geometry and whole-footprint zone membership.
 */
export const FOOTPRINT_EPSILON = 1e-9;
