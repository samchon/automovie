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
 * 3. A humidity of 0 or above 1 refuses.
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
  TestValidator.error("dry air", (): number => AutoMovieEngineEnvironment.dewPoint(20, 0));
  TestValidator.error("supersaturated air", (): number =>
    AutoMovieEngineEnvironment.dewPoint(20, 1.01),
  );
}
