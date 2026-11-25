import type {
  AutoMovieCubicBezierControls3,
  IAutoMovieCubicBezierCurve64,
  IAutoMovieRecoveryEventCurvePiece,
} from "@automovie/interface";
import { readRecoveryEventCurveControls } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * `readRecoveryEventCurveControls` gives the four controls of the part of a
 * native cubic that an occurrence uses: the whole net for [0, 1], the
 * restriction for a sub-interval, and the reversed controls when it runs
 * backwards.
 *
 * The test curve is a straight cubic with x(t) = 3 t, so its controls are at x
 * = 0, 1, 2, 3 and the restriction to [a, b] has evenly spaced controls from 3a
 * to 3b.
 *
 * Scenarios:
 *
 * 1. The interval [0, 1] gives the parent controls.
 * 2. The interval [1/2, 1] gives x = 1.5, 2, 2.5, 3.
 * 3. The interval from 1 to 1/2 gives the same controls reversed.
 * 4. An empty interval is refused.
 */
export function test_unit_recovery_internal_read_event_curve_controls(): void {
  const net: AutoMovieCubicBezierControls3 = [
    [0, 0, 0],
    [1, 0, 0],
    [2, 0, 0],
    [3, 0, 0],
  ];
  const curve: IAutoMovieCubicBezierCurve64 = {
    type: "cubicBezier",
    name: "arc",
    closed: false,
    unit: "mm",
    phaseUnit: "mm",
    phaseIntervals: [3],
    spans: [net],
  };
  const piece = (
    start: number,
    end: number,
  ): IAutoMovieRecoveryEventCurvePiece => ({
    source: {
      authority: "arc",
      curve,
      endpointAuthorities: ["start", "end"],
      start,
      end,
    },
    width: 1,
  });
  const xs = (controls: AutoMovieCubicBezierControls3): number[] =>
    controls.map((point: readonly number[]): number => point[0]!);
  const close = (actual: number[], expected: number[]): boolean =>
    actual.every((value: number, at: number): boolean =>
      nclose(value, expected[at]!, 1e-12),
    );
  TestValidator.predicate(
    "the whole curve",
    close(xs(readRecoveryEventCurveControls(piece(0, 1))), [0, 1, 2, 3]),
  );
  TestValidator.predicate(
    "the upper half",
    close(xs(readRecoveryEventCurveControls(piece(0.5, 1))), [
      1.5, 2, 2.5, 3,
    ]),
  );
  TestValidator.predicate(
    "the upper half reversed",
    close(xs(readRecoveryEventCurveControls(piece(1, 0.5))), [
      3, 2.5, 2, 1.5,
    ]),
  );
  TestValidator.error("an empty interval", (): unknown =>
    readRecoveryEventCurveControls(piece(0.5, 0.5)),
  );
}
