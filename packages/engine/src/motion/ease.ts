import { AutoMovieEasing } from "@automovie/interface";

/**
 * Evaluate a normalized easing curve: maps a linear progress `t` in `[0, 1]`
 * between two keyframes to an eased progress in `[0, 1]`.
 *
 * Covers the named {@link AutoMovieEasing} curves. `cubicBezier` is handled
 * separately by {@link cubicBezierEasing} since it needs the keyframe's control
 * points; passing `"cubicBezier"` here falls back to linear.
 *
 * @evidence contracts/common.md#principled-implementation Evaluates the named polynomial or step curve after clamping finite progress to [0,1]; step changes exactly at the closed end and cubicBezier requires separate control-point evaluation, so this selector returns its linear progress.
 * @evidence contracts/common.md#clear-and-simple-design An exhaustive curve switch owns named formulas; cubicBezierEasing owns inversion of a parameterized curve rather than adding unused control-point arguments here.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nonfinite progress and unknown runtime curve names throw; the documented cubicBezier linear result is an explicit API limitation, not a consumer-specific substitution.
 * @evidence contracts/common.md#meaningful-documentation States normalized clamping, named-curve scope and the cubicBezier control-point seam.
 * @evidence contracts/performance.md#efficient-algorithms Curve selection and each fixed polynomial/step formula take constant work and allocate no arrays or lookup structures.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work These scalar formulas have no retained cache; each current progress is evaluated directly.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns one scalar and retains neither progress nor any external resource after completion or throw.
 *
 * @author Samchon
 */
export const ease: (curve: AutoMovieEasing, t: number) => number = (
  curve: AutoMovieEasing,
  t: number,
): number => {
  if (!Number.isFinite(t)) throw new Error("easing progress must be finite");
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
