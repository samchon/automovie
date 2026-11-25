import type {
  AutoMovieCubicBezierControls3,
  IAutoMovieCubicBezierCurve64,
} from "@automovie/interface";
import { normalizeRecoveryCourse } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * `normalizeRecoveryCourse` scales an open millimetre curve's phase widths to
 * sum to one, and when asked reverses the spans, their control order and their
 * widths together.
 *
 * Scenarios:
 *
 * 1. Widths (1, 3) become (1/4, 3/4) with the spans untouched, and the
 *    normalized widths sum to exactly 1.
 * 2. Reversed, the widths become (3/4, 1/4), the span order flips and each
 *    span's four controls reverse.
 * 3. A closed curve is refused.
 */
export function test_unit_recovery_internal_normalize_course(): void {
  const a: AutoMovieCubicBezierControls3 = [
    [0, 0, 0],
    [1, 0, 0],
    [2, 0, 0],
    [3, 0, 0],
  ];
  const b: AutoMovieCubicBezierControls3 = [
    [3, 0, 0],
    [3, 1, 0],
    [3, 2, 0],
    [3, 3, 0],
  ];
  const curve: IAutoMovieCubicBezierCurve64 = {
    type: "cubicBezier",
    name: "course",
    closed: false,
    unit: "mm",
    phaseUnit: "mm",
    phaseIntervals: [1, 3],
    spans: [a, b],
  };
  const forward: IAutoMovieCubicBezierCurve64 = normalizeRecoveryCourse(
    curve,
    false,
  );
  TestValidator.predicate(
    "forward widths",
    nclose(forward.phaseIntervals[0]!, 0.25, 1e-15) &&
      nclose(forward.phaseIntervals[1]!, 0.75, 1e-15),
  );
  TestValidator.equals(
    "the widths close the unit phase",
    forward.phaseIntervals[0]! + forward.phaseIntervals[1]!,
    1,
  );
  TestValidator.equals("forward spans", forward.spans, [a, b]);
  TestValidator.equals("normalized phase", forward.phaseUnit, "normalized");

  const backward: IAutoMovieCubicBezierCurve64 = normalizeRecoveryCourse(
    curve,
    true,
  );
  TestValidator.predicate(
    "reversed widths",
    nclose(backward.phaseIntervals[0]!, 0.75, 1e-15) &&
      nclose(backward.phaseIntervals[1]!, 0.25, 1e-15),
  );
  TestValidator.equals("reversed spans", backward.spans, [
    [b[3], b[2], b[1], b[0]],
    [a[3], a[2], a[1], a[0]],
  ]);
  TestValidator.error("a closed curve", (): unknown =>
    normalizeRecoveryCourse({ ...curve, closed: true }, false),
  );
}
