import type {
  AutoMovieCubicBezierControls3,
  IAutoMovieCubicBezierCurve64,
  IAutoMovieRecoveryEventCurveSource,
} from "@automovie/interface";
import { AutoMovieRecoveryEventCurve } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieRecoveryEventCurve.fullparentControls` admits the single complete
 * Bernstein curve that supplies an event occurrence, and gives its four
 * controls.
 *
 * Scenarios:
 *
 * 1. One millimetre cubic with one positive phase width gives its span.
 * 2. Two spans are refused.
 * 3. Nonfinite controls and zero or infinite phase widths are refused.
 * 4. A two-span native path preserves its explicit finite chart partition and
 *    endpoint identity. A NaN knot or endpoint phase and an overflowing line
 *    length are refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names one finite millimetre cubic and its positive phase-width requirement.
 * @evidence contracts/development/testing.md#behavioral-verification Reads a finite native authority, admits a two-span partition, then supplies invalid controls, widths, phases and length.
 * @evidence contracts/development/testing.md#independent-expectations The fixture gives the exact native controls, normalized knot 0.75 and native endpoint identity arc.knot1. A NaN phase cannot identify any original observation.
 */
export function test_recovery_internal_read_event_curve_parent(): void {
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
    AutoMovieRecoveryEventCurve.fullparentControls(source(curve)),
    net,
  );
  TestValidator.error("two spans", (): unknown =>
    AutoMovieRecoveryEventCurve.fullparentControls(
      source({ ...curve, phaseIntervals: [1, 2], spans: [net, net] }),
    ),
  );
  TestValidator.error("a zero phase width", (): unknown =>
    AutoMovieRecoveryEventCurve.fullparentControls(
      source({ ...curve, phaseIntervals: [0] }),
    ),
  );
  const nonfinite: AutoMovieCubicBezierControls3 = [
    [Infinity, 0, 0],
    net[1],
    net[2],
    net[3],
  ];
  for (const malformed of [
    { ...curve, phaseIntervals: [Infinity] },
    { ...curve, spans: [nonfinite] },
  ]) {
    TestValidator.error("reject an invalid native parent", (): unknown =>
      AutoMovieRecoveryEventCurve.fullparentControls(source(malformed)),
    );
    TestValidator.error("reject an invalid native occurrence", (): unknown =>
      AutoMovieRecoveryEventCurve.fromCurve(malformed),
    );
  }
  const next: AutoMovieCubicBezierControls3 = [
    net[3],
    [4, 0, 0],
    [5, 0, 0],
    [6, 0, 0],
  ];
  const pair: IAutoMovieCubicBezierCurve64 = {
    ...curve,
    phaseIntervals: [3, 3],
    spans: [net, next],
  };
  const arc = AutoMovieRecoveryEventCurve.fromCurve({
    ...pair,
    canonicalKnots: [0, 0.75, 1],
  });
  TestValidator.equals(
    "explicit canonical knots and the original endpoint identity survive together",
    [
      AutoMovieRecoveryEventCurve.knots(arc),
      AutoMovieRecoveryEventCurve.endpointAuthority(arc.pieces[1]!, 0),
    ],
    [[0, 0.75, 1], "arc.knot1"],
  );
  TestValidator.error("nonfinite canonical knot", (): unknown =>
    AutoMovieRecoveryEventCurve.fromCurve({
      ...pair,
      canonicalKnots: [0, NaN, 1],
    }),
  );
  TestValidator.error(
    "a malformed phase is not an interior endpoint",
    (): unknown =>
      AutoMovieRecoveryEventCurve.endpointAuthority(
        {
          ...arc.pieces[0]!,
          source: { ...arc.pieces[0]!.source, start: NaN },
        },
        0,
      ),
  );
  TestValidator.error("a line of unrepresentable length", (): unknown =>
    AutoMovieRecoveryEventCurve.line(
      [-Number.MAX_VALUE, 0, 0],
      [Number.MAX_VALUE, 0, 0],
      "overflow",
    ),
  );
}
