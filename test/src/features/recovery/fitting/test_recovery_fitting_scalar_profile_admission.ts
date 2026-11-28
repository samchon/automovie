import { AutoMovieRecoveryProfileFitting } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../../internal/predicates";

/**
 * Checks admission and units for a scalar profile solved in one cubic span.
 *
 * Scenarios:
 *
 * 1. Four stations on a linear profile yield the original line in metres.
 * 2. Fractional spans, a NaN rank threshold, a NaN value and a sample outside the
 *    endpoint chart refuse with the relevant admission diagnostic.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the fitted metre units and the independent numeric input failures.
 * @evidence contracts/development/testing.md#behavioral-verification Calls fitScalarProfiles directly on four typed rows and checks its controls, physical interval and malformed-input diagnostics.
 * @evidence contracts/development/testing.md#independent-expectations Uses the analytic line y + 100 in millimetres. Its cubic controls divide the metre interval into thirds, and invalid admissions follow the documented chart and budget limits.
 */
export function test_recovery_fitting_scalar_profile_admission(): void {
  const samples: { yMm: number; values: number[] }[] = [0, 100, 200, 300].map(
    (yMm: number): { yMm: number; values: number[] } => ({
      yMm,
      values: [100 + yMm],
    }),
  );
  const fit = AutoMovieRecoveryProfileFitting.fitScalarProfiles(
    samples,
    1,
    1e-10,
  );
  TestValidator.equals("one cubic", fit.spans.length, 1);
  TestValidator.predicate(
    "physical interval in metres",
    nclose(fit.spans[0]!.interval[0], 0) &&
      nclose(fit.spans[0]!.interval[1], 0.3),
  );
  TestValidator.predicate(
    "Bernstein controls of the line in metres",
    fit.spans[0]!.profiles[0]!.every((value: number, index: number): boolean =>
      nclose(value, (index + 1) / 10, 1e-12),
    ),
  );
  const cases: [string, () => unknown, string][] = [
    [
      "fractional count",
      (): unknown =>
        AutoMovieRecoveryProfileFitting.fitScalarProfiles(samples, 1.5, 1e-10),
      "invalid-fit-policy",
    ],
    [
      "NaN rank",
      (): unknown =>
        AutoMovieRecoveryProfileFitting.fitScalarProfiles(samples, 1, NaN),
      "invalid-fit-policy",
    ],
    [
      "NaN observation",
      (): unknown =>
        AutoMovieRecoveryProfileFitting.fitScalarProfiles(
          samples.map((sample, index) =>
            index === 1 ? { ...sample, values: [NaN] } : sample,
          ),
          1,
          1e-10,
        ),
      "Complete finite scalar profile rows required",
    ],
    [
      "outside chart",
      (): unknown =>
        AutoMovieRecoveryProfileFitting.fitScalarProfiles(
          samples.map((sample, index) =>
            index === 1 ? { ...sample, yMm: -1 } : sample,
          ),
          1,
          1e-10,
        ),
      "invalid-fit-chart",
    ],
  ];
  TestValidator.equals(
    "invalid rows and policies fail at admission",
    cases
      .filter(([, call, reason]) => !throwsError(call, reason))
      .map(([name]) => name),
    [],
  );
}
