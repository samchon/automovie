import type {
  AutoMovieCubicBezierControls3,
  IAutoMovieCubicBezierCurve64,
  IAutoMovieRecoveryEventCurveSource,
} from "@automovie/interface";
import { readRecoveryEventCurveParent } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

/**
 * `readRecoveryEventCurveParent` admits the single complete Bernstein curve
 * that supplies an event occurrence, and gives its four controls.
 *
 * Scenarios:
 *
 * 1. One millimetre cubic with one positive phase width gives its span.
 * 2. Two spans are refused.
 * 3. A zero phase width is refused.
 */
export function test_unit_recovery_internal_read_event_curve_parent(): void {
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
  const source = (
    value: IAutoMovieCubicBezierCurve64,
  ): IAutoMovieRecoveryEventCurveSource => ({
    authority: "arc",
    curve: value,
    endpointAuthorities: ["start", "end"],
    start: 0,
    end: 1,
  });
  TestValidator.equals(
    "the span",
    readRecoveryEventCurveParent(source(curve)),
    net,
  );
  TestValidator.error("two spans", (): unknown =>
    readRecoveryEventCurveParent(
      source({ ...curve, phaseIntervals: [1, 2], spans: [net, net] }),
    ),
  );
  TestValidator.error("a zero phase width", (): unknown =>
    readRecoveryEventCurveParent(source({ ...curve, phaseIntervals: [0] })),
  );
}
