import { cubicBezierEasing, ease } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, nclose, throwsError } from "../internal/predicates";

/**
 * `cubicBezierEasing` solves the parametric Bézier `x(s)=t` (Newton with
 * safeguards) and returns `y(s)`. This pins its endpoints, its agreement with
 * the linear curve, the degenerate-slope safeguard, and the `ease()` fallback
 * for the `"cubicBezier"` curve name.
 *
 * Scenarios:
 *
 * 1. Linear control points [0,0,1,1] reproduce the identity curve: output ≈ input
 *    at 0.25 and 0.5 (to 1e-3, since Newton converges, not exactly).
 * 2. Any curve is pinned at its endpoints: a standard ease [0.42,0,0.58,1] returns
 *    exactly 0 at t=0 and 1 at t=1.
 * 3. Degenerate control points [0,0,0,0] make the x-curve `s³`, whose derivative
 *    `3s²` underflows the Newton slope guard (|slope| < 1e-6) for a tiny `t`;
 *    the solver must break safely (no NaN/Infinity from dividing by ~0) and
 *    still return a finite value within [0,1]. This exercises the safeguard
 *    branch a happy-path curve never reaches.
 * 4. `ease("cubicBezier", x)`, called without control points, falls back to the
 *    linear identity (the control points live on the keyframe, not here).
 * 5. Invalid scalars reject; finite out-of-range progress clamps.
 * 6. The bisection fallback: the legal steep curve [1,0,0,1] has x'(0.5)=0, so
 *    Newton stalls or diverges around the middle; the solver must land on the
 *    bisection oracle (x(s)=4s³−6s²+3s, y(s)=3s²−2s³): t=0.5 → 0.5 exactly,
 *    t=0.51 → ≈0.6983 (the unconverged Newton was off by ~0.30), and the mirror
 *    t=0.49 → ≈0.3017.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls cubicBezierEasing and the named ease selector, checking identity/endpoint values, finite degenerate output, steep-curve inversions, clamping and named finite-input refusals. Unconverged Newton output near the stationary derivative or accepting nonfinite arguments fails these observations.
 * @evidence contracts/testing.md#independent-expectations Equal X/Y controls define identity; the fixed endpoints define zero/one. For [1,0,0,1], x(s)=4s cubed-6s squared+3s and y(s)=3s squared-2s cubed give the retained .5/.6983/.3017 oracle values. The degenerate case checks only finite range, not inversion accuracy, and tolerances permit solver rounding.
 * @evidence contracts/testing.md#distinguishing-cases Preserves two identity samples, both endpoints, one degenerate-slope input, control-free cubicBezier selection, nonfinite progress and each control coordinate, exterior clamping and three steep-curve samples. CSS X-domain validation and finite Y overshoot are owned by motion admission.
 * @evidence contracts/testing.md#execution-ownership The named synchronous unit owns every inversion case and invokes portable scalar source with existing local observers, without consumer installation, native compilation, host startup or dynamic registration.
 */
export function test_motion_cubic_bezier(): void {
  // 1. linear control points ≈ identity
  TestValidator.predicate(
    "linear bezier at 0.25",
    nclose(cubicBezierEasing([0, 0, 1, 1], 0.25), 0.25, 1e-3),
  );
  TestValidator.predicate(
    "linear bezier at 0.5",
    nclose(cubicBezierEasing([0, 0, 1, 1], 0.5), 0.5, 1e-3),
  );

  // 2. endpoints pinned
  TestValidator.predicate(
    "endpoint 0",
    nclose(cubicBezierEasing([0.42, 0, 0.58, 1], 0), 0, 1e-3),
  );
  TestValidator.predicate(
    "endpoint 1",
    nclose(cubicBezierEasing([0.42, 0, 0.58, 1], 1), 1, 1e-3),
  );

  // 3. degenerate slope safeguard: result stays finite and in range
  const degenerate: number = cubicBezierEasing([0, 0, 0, 0], 1e-4);
  TestValidator.equals(
    "degenerate slope stays finite & in [0,1]",
    namedFacts([
      ["isFiniteDegenerate", (): boolean => Number.isFinite(degenerate)],
      ["degenerate", (): boolean => degenerate >= 0],
      ["degenerate2", (): boolean => degenerate <= 1],
    ]),
    { isFiniteDegenerate: true, degenerate: true, degenerate2: true },
  );

  // 4. ease() fallback for the cubicBezier name
  TestValidator.predicate(
    "ease(cubicBezier) falls back to linear",
    nclose(ease("cubicBezier", 0.5), 0.5),
  );

  // 5. invalid scalars reject; finite out-of-range progress still clamps
  TestValidator.predicate(
    "ease rejects nan progress",
    throwsError((): number => ease("linear", Number.NaN), "easing progress must be finite"),
  );
  TestValidator.predicate(
    "bezier rejects nan progress",
    throwsError((): number => cubicBezierEasing([0, 0, 1, 1], Number.NaN), "easing progress must be finite"),
  );
  const invalidControls: [string, [number, number, number, number]][] = [
    ["x1", [Number.NaN, 0, 1, 1]],
    ["y1", [0, Number.NaN, 1, 1]],
    ["x2", [0, 0, Infinity, 1]],
    ["y2", [0, 0, 1, -Infinity]],
  ];
  for (const [name, control] of invalidControls)
    TestValidator.predicate(
      `bezier rejects non-finite ${name}`,
      throwsError((): number => cubicBezierEasing(control, 0.5), "cubic bezier control points must be finite"),
    );
  TestValidator.predicate(
    "ease clamps finite low",
    nclose(ease("linear", -1), 0),
  );
  TestValidator.predicate(
    "bezier clamps finite high",
    nclose(cubicBezierEasing([0, 0, 1, 1], 2), 1, 1e-3),
  );

  // 6. steep-curve bisection fallback lands on the analytic oracle
  const steep: [number, number, number, number] = [1, 0, 0, 1];
  TestValidator.predicate(
    "steep curve at the stall point t=0.5",
    nclose(cubicBezierEasing(steep, 0.5), 0.5, 1e-3),
  );
  TestValidator.predicate(
    "steep curve just past the stall (bisection oracle 0.6983)",
    nclose(cubicBezierEasing(steep, 0.51), 0.6983, 2e-3),
  );
  TestValidator.predicate(
    "steep curve mirror side (bisection oracle 0.3017)",
    nclose(cubicBezierEasing(steep, 0.49), 0.3017, 2e-3),
  );
}
