import { IAutoMovieTransform } from "@automovie/interface";
import { Matrix4 } from "../math/Matrix4";

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

/**
 * Wrap a non-negative time onto `[0, duration)`, matching the sampler's loop
 * handling. Callers guarantee `seconds >= 0` (a shot's local clock never runs
 * backwards), so no negative-modulo correction is needed.
 */
const wrapTime = (seconds: number, duration: number): number =>
  seconds % duration;

const toMatrix = (transform: IAutoMovieTransform): number[] =>
  Matrix4.compose(transform.translation, transform.rotation, transform.scale);
