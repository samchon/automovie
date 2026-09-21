import { IAutoMovieClipShapeFault } from "./IAutoMovieClipShapeFault";

/**
 * The `loop` flag, which decides whether a query time wraps or clamps. A
 * non-boolean would take that branch on JavaScript truthiness, so a clip
 * carrying `"false"` would loop.
 *
 * Separate from {@link clipDurationFault} because the artifact gate applies a
 * STRICTER duration rule than the sampler (a committed clip must last longer
 * than zero seconds, `validateClipArtifact`), and a gate stricter than the
 * sampler cannot let a throw escape. Only the looser direction is a defect.
 *
 * @evidence requirements/motion/clips-keyframes-and-interpolation.md#motion-loop-trim `clipLoopFault` refuses a non-boolean loop declaration before truthiness can silently change boundary sampling.
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation `clipLoopFault` preserves the observed loop payload beside the explicit wrap-or-clamp contract.
 */
export const clipLoopFault = (
  loop: unknown,
): IAutoMovieClipShapeFault | null =>
  typeof loop === "boolean"
    ? null
    : {
        kind: "type",
        field: "loop",
        message: `loop must be boolean, but was ${String(loop)}`,
        value: loop,
      };
