/*
 * Seconds before toe-off over which a stance's departure rates are read: a
 * backward difference over a millisecond, far under a stance's tenths of a
 * second, whose endpoints are settled to the reach owner's nanometre root
 * tolerance.
 */
export const WALK_TICK: number = 1e-3;
