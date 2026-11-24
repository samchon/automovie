import type {
  IAutoMovieAnalysisMetric,
  IAutoMovieAnalysisRun,
  IAutoMovieAnalysisWorkplane,
  IAutoMovieDaylightRequest,
} from "@automovie/interface";

import { assertAnalysisDaylightWorkplanePart1 } from "../../../internal/assertAnalysisDaylightWorkplanePart1";
import { assertAnalysisDaylightWorkplanePart2 } from "../../../internal/assertAnalysisDaylightWorkplanePart2";
import { assertAnalysisDaylightWorkplanePart3 } from "../../../internal/assertAnalysisDaylightWorkplanePart3";

/**
 * Measure beam, isotropic sky and point-luminaire light on declared workplanes, preserving unsupported reflection and missing-emitter gaps.
 *
 * Scenarios:
 * 1. Noon on an unobstructed horizontal plane matches beam plus sky within the existing numeric tolerance, with a daylight factor of 100% and unit uniformity and contrast.
 * 2. A different sun changes the beam by its cosine within 1e-9, and a dark instant leaves the plane at zero with the uniformity, contrast and daylight-factor gaps that a zero plane implies.
 * 3. A canopy over the plane removes the beam and the whole sky vault; a downward-facing plane loses the vault to the ground instead.
 * 4. A vertical plane sees the analytic half of the isotropic vault.
 * 5. An artificial-only study matches the inverse square law within the existing tolerance, names its domain `artificial-light`, and gaps every daylight metric as `not-run`.
 * 6. A fitting behind the plane, a fitting on the plane, and a fitting a shade stands in front of each contribute nothing, the second with a warning.
 * 7. One shaded cell of two makes uniformity zero and contrast a gap, and the field records one sample per cell.
 * 8. An unimplemented sky model is `unsupported`; a study with no sun and no fitting is `not-run`.
 * 9. Declared targets judge in the unit they are declared in; a target in another unit is dropped with a warning rather than compared across units, and a target naming a metric the study never reports is warned about too.
 * 10. Repeated requests keep their digest and the examined shade, instant and sample-count changes alter it.
 * 11. Every malformed request in the existing table is refused at its own message fragment.
 */
export function test_unit_engine_analysis_daylight_workplane(): void {
  const {
    upward,
    study,
    metrics,
    of,
    statusOf,
    noon,
    afternoon,
    shaded,
  }: {
    upward: IAutoMovieAnalysisWorkplane;
    study: (
      overrides?: Partial<IAutoMovieDaylightRequest>,
    ) => IAutoMovieAnalysisRun;
    metrics: (run: IAutoMovieAnalysisRun) => IAutoMovieAnalysisMetric[];
    of: (run: IAutoMovieAnalysisRun, key: string) => number | null;
    statusOf: (run: IAutoMovieAnalysisRun, key: string) => string;
    noon: IAutoMovieAnalysisRun;
    afternoon: IAutoMovieAnalysisRun;
    shaded: IAutoMovieAnalysisRun;
  } = assertAnalysisDaylightWorkplanePart1();
  assertAnalysisDaylightWorkplanePart2(upward, study, metrics, of, statusOf);
  assertAnalysisDaylightWorkplanePart3(upward, study, noon, afternoon, shaded);
}
