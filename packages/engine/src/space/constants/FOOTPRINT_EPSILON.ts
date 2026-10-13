/**
 * Slack, in metres, within which a plan point counts as standing on a ring.
 *
 * A nanometre is exact for authored coordinates while keeping the classifier
 * from flickering across a rim as the last bits of a coordinate move.
 */
export const FOOTPRINT_EPSILON = 1e-9;
