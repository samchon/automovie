/**
 * One storage unit of a skin or attachment weight. Published weights were
 * stored at 1e-7 or finer, so a difference at or below this is storage, not a
 * different weight: provenance classification and the full-attachment test
 * of head landmark selection both read it here.
 */
export const humanSourceWeightTolerance = 1e-7;
