import { AutoMovieEngineEnvironment } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * `calculateDewPoint` is the Magnus dew point with Sonntag's coefficients (a =
 * 17.62, b = 243.12 °C).
 *
 * Scenarios:
 *
 * 1. Saturated air is at its own dew point: 20 °C at RH 1 gives 20 °C.
 * 2. 20 °C at RH 0.5: the psychrometric table value 9.3 °C, to 0.1 °C.
 * 3. Zero and supersaturated humidity and nonfinite humidity or temperature are
 *    refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the stated Magnus approximation, air humidity domain and a saturated-air invariant.
 * @evidence contracts/development/testing.md#behavioral-verification Computes dew point at 20 °C for saturated and half-saturated air and tries zero and supersaturation. Nonfinite values of either input must also throw.
 * @evidence contracts/development/testing.md#independent-expectations Saturated air gives exactly 20 °C. The fixture's psychrometric reference at humidity 0.5 is 9.3 °C within 0.1 °C, independent of the implementation calculation.
 */
export function test_engine_analysis_dew_point(): void {
  TestValidator.predicate(
    "saturated air",
    nclose(AutoMovieEngineEnvironment.dewPoint(20, 1), 20, 1e-12),
  );
  TestValidator.predicate(
    "half saturated air",
    nclose(AutoMovieEngineEnvironment.dewPoint(20, 0.5), 9.3, 0.1),
  );
  TestValidator.error("dry air", (): number =>
    AutoMovieEngineEnvironment.dewPoint(20, 0),
  );
  TestValidator.error("supersaturated air", (): number =>
    AutoMovieEngineEnvironment.dewPoint(20, 1.01),
  );
  for (const value of [NaN, Infinity, Number.NEGATIVE_INFINITY]) {
    TestValidator.error(`nonfinite temperature ${value}`, (): number =>
      AutoMovieEngineEnvironment.dewPoint(value, 0.5),
    );
    TestValidator.error(`nonfinite humidity ${value}`, (): number =>
      AutoMovieEngineEnvironment.dewPoint(20, value),
    );
  }
}
