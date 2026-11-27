/**
 * Dead band of the film-grammar read: a projected depth, an occupancy, a
 * camera-bearing length product or a signed screen offset at or below this
 * reads as zero, so a subject on a line or at the lens reads as neutral or
 * unmeasurable rather than as a sign flipped by rounding.
 */
export const GRAMMAR_EPSILON: number = 1e-6;
