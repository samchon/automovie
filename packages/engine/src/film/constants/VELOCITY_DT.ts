/**
 * Finite-difference window for the end-velocity estimate, seconds: one frame of
 * the engine's default 24 Hz clock. Shared with {@link resolveBeatEnd}'s
 * baked-follow velocity so a mounted rider's end velocity uses the same
 * window.
 *
 * @evidence requirements/motion/validation-and-determinism.md#motion-fixed-step-baked-state VELOCITY_DT makes sampled motion replay deterministic: Finite-difference window for the end-velocity estimate, seconds: one frame of the engine's default 24 Hz clock. Shared with {@link resolveBeatEnd}'s baked-follow velocity so a mounted rider's end velocity uses the same window.
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-deterministic-sampling-validation VELOCITY_DT realizes deterministic motion sampling: Finite-difference window for the end-velocity estimate, seconds: one frame of the engine's default 24 Hz clock. Shared with {@link resolveBeatEnd}'s baked-follow velocity so a mounted rider's end velocity uses the same window.
 */
export const VELOCITY_DT = 1 / 24;
