/**
 * Finite-difference window for the end-velocity estimate, seconds: one frame of
 * the engine's default 24 Hz clock. Shared with {@link resolveBeatEnd}'s
 * baked-follow velocity so a mounted rider's end velocity uses the same
 * window.
 */
export const VELOCITY_DT = 1 / 24;
