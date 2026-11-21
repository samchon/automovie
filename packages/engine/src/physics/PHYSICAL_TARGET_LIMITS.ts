/**
 * Shared coordinate and residual caps for one bounded numerical fit: one
 * combined target system admits at most 64 free coordinates and 1024 finite
 * scalar rows.
 */
export const PHYSICAL_TARGET_LIMITS = { coordinates: 64, rows: 1024 } as const;
