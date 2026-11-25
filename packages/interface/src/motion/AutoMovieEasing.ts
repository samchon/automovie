/**
 * The interpolation curve used to blend from one keyframe to the next.
 *
 * Motion in automovie stores sparse keyframes and outgoing easing. The engine
 * samples the declared curve at the consumer's frame rate; interpolation
 * determines the path between authored keys but does not remove discontinuities
 * or implausible poses already present in those keys.
 *
 * The named curves cover the common ergonomic cases; `cubicBezier` is the
 * escape hatch for an explicit curve (control points carried on the keyframe).
 */
export type AutoMovieEasing =
  /** Constant-rate linear blend. */
  | "linear"

  /** Slow start. */
  | "easeIn"

  /** Slow stop. */
  | "easeOut"

  /** Slow start and stop (most natural for body motion). */
  | "easeInOut"

  /** No blend: hold, then jump at the next keyframe (snappy / robotic). */
  | "step"

  /** Explicit cubic Bézier; control points supplied on the keyframe. */
  | "cubicBezier";
