import type {
  AutoMovieRecoveryCurveData,
  IAutoMovieCubicBezierCurve64,
  IAutoMoviePolylineFit,
  IAutoMovieRecoveryCurveBundle,
} from "@automovie/interface";
import { AutoMovieRecoveryCurveConversion } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieRecoveryCurveConversion.convertBundle` rewrites every cubic at a record's declared
 * curve places in the requested basis and returns a copy; the other fields are
 * kept and the input is left as it was.
 *
 * Scenarios:
 *
 * 1. A polyline fit's curve turns Hermite, its residual fields kept.
 * 2. A section's loop and a report's open arc both turn Hermite.
 * 3. The input record still holds its Bernstein curves.
 */
export function test_recovery_curves_convert_curves(): void {
  const curve: IAutoMovieCubicBezierCurve64 = {
    type: "cubicBezier",
    name: "line",
    closed: false,
    unit: "mm",
    phaseUnit: "mm",
    phaseIntervals: [3],
    spans: [
      [
        [0, 0, 0],
        [1, 0, 0],
        [2, 0, 0],
        [3, 0, 0],
      ],
    ],
  };
  const fit: IAutoMoviePolylineFit = {
    curve,
    sampleMaximumMm: 0.5,
    polylineUpperEstimateMm: 0.6,
    toleranceMet: true,
    observationsPerSpan: 4,
    handleFallbacks: 0,
  };
  const converted: AutoMovieRecoveryCurveData<
    IAutoMoviePolylineFit,
    "hermite"
  > = AutoMovieRecoveryCurveConversion.convertBundle(fit, "hermite");
  TestValidator.predicate(
    "the fit's curve",
    converted.curve.type === "cubicHermite" &&
      converted.sampleMaximumMm === 0.5 &&
      converted.observationsPerSpan === 4,
  );
  const record: IAutoMovieRecoveryCurveBundle = {
    sections: [{ loops: [{ curve: { ...curve, name: "loop" } }] }],
    reports: [{ open: [{ curve: { ...curve, name: "arc" } }] }],
  };
  const both: AutoMovieRecoveryCurveData<
    IAutoMovieRecoveryCurveBundle,
    "hermite"
  > = AutoMovieRecoveryCurveConversion.convertBundle(record, "hermite");
  TestValidator.equals(
    "the loop and the arc",
    [
      both.sections![0]!.loops[0]!.curve.type,
      both.reports![0]!.open[0]!.curve.type,
    ],
    ["cubicHermite", "cubicHermite"],
  );
  TestValidator.equals(
    "the input kept",
    [fit.curve.type, record.sections![0]!.loops[0]!.curve.type],
    ["cubicBezier", "cubicBezier"],
  );
}
