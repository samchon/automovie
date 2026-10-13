/**
 * The interpolation curve used to blend from one keyframe to the next.
 *
 * Motion in automovie is **sparse keyframes + easing**, not dense per-frame emission. The model places a handful of key poses and names how to glide between them; the engine samples the curve at the consumer's frame rate. This is what makes motion both cheap (few tokens) and temporally coherent (the curve removes jitter that independent per-frame emission would introduce).
 *
 * The named curves cover the common ergonomic cases; `cubicBezier` is the escape hatch for an explicit curve (control points carried on the keyframe).
 *
 * @evidence contracts/common.md#principled-implementation The named curves map normalized segment progress into interpolation weight, with quadratic ease-in and ease-out, piecewise ease-in-out and a held step; cubicBezier uses explicit controls and inversion of its monotone time coordinate.
 * @evidence contracts/common.md#clear-and-simple-design A closed curve name stays on the outgoing keyframe, with explicit cubic controls on that keyframe rather than a second interpolation configuration hierarchy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Curves depend on normalized time rather than frame number or actor identity; cubic control x values are range-checked before the solver instead of selecting an arbitrary root of a nonmonotone time curve.
 * @evidence contracts/common.md#meaningful-documentation Identifies the outgoing segment, sparse sampling model and each named curve's start and stop behavior, with explicit control ownership for cubicBezier.
 * @author Samchon
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
