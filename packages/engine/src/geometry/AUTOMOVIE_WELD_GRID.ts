/**
 * The grid on which mesh topology queries weld positions: one nanometre, far
 * below any building tolerance, and coarse enough that a ring seam whose
 * cos/sin were recomputed with ~1e-16 float error still lands on one point.
 * Every measurement that decides whether two corners are the same welded
 * vertex rounds to this grid, so the answer does not depend on which
 * measurement asked.
 */
export const AUTOMOVIE_WELD_GRID = 1e9;
