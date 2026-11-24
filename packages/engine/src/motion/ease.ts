import { AutoMovieEasing } from "@automovie/interface";

/**
 * Evaluate a normalized easing curve: maps a linear progress `t` in `[0, 1]`
 * between two keyframes to an eased progress in `[0, 1]`.
 *
 * Covers the named {@link AutoMovieEasing} curves. `cubicBezier` is handled
 * separately by {@link cubicBezierEasing} since it needs the keyframe's control
 * points; passing `"cubicBezier"` here falls back to linear.
 */
export const ease: (curve: AutoMovieEasing, t: number) => number = (
  curve: AutoMovieEasing,
  t: number,
): number => {
  const x: number = Math.min(1, Math.max(0, t));
  switch (curve) {
    case "linear":
      return x;
    case "easeIn":
      return x * x;
    case "easeOut":
      return 1 - (1 - x) * (1 - x);
    case "easeInOut":
      return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
    case "step":
      return x < 1 ? 0 : 1;
    case "cubicBezier":
      return x; // needs control points (see cubicBezierEasing)
  }
  throw new Error(`unknown easing curve "${String(curve)}"`);
};
