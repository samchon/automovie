/**
 * Two micrometre storage units, metres. Published displacements were stored
 * at 1e-6 m or finer, so a difference at or below this is storage, not shape:
 * provenance classification and the head-shaping test both read it here.
 */
export const humanSourcePositionTolerance = 2e-6;
