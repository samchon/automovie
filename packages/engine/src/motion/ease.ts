import { AutoMovieEasing } from "@automovie/interface";

/**
 * Evaluate a normalized easing curve: maps a linear progress `t` in `[0, 1]`
 * between two keyframes to an eased progress in `[0, 1]`.
 *
 * Covers the named {@link AutoMovieEasing} curves. `cubicBezier` is handled
 * separately by {@link cubicBezierEasing} since it needs the keyframe's control
 * points; passing `"cubicBezier"` here falls back to linear.
 *
 * @evidence requirements/motion/clips-keyframes-and-interpolation.md#motion-interpolation Evaluates each supported named interpolation law over normalized segment progress.
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Produces the curve parameter used to sample a clip segment.
 * @author Samchon
 */
export const ease = (curve: AutoMovieEasing, t: number): number => {
  if (!Number.isFinite(t)) throw new Error("easing progress must be finite");
  const x = Math.min(1, Math.max(0, t));
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
