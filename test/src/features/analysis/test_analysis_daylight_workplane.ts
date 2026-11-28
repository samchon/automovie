import type {
  IAutoMovieAnalysisMetric,
  IAutoMovieAnalysisRun,
  IAutoMovieAnalysisWorkplane,
  IAutoMovieDaylightRequest,
} from "@automovie/interface";

import { assertAnalysisDaylightWorkplanePart1 } from "../internal/assertAnalysisDaylightWorkplanePart1";
import { assertAnalysisDaylightWorkplanePart2 } from "../internal/assertAnalysisDaylightWorkplanePart2";
import { assertAnalysisDaylightWorkplanePart3 } from "../internal/assertAnalysisDaylightWorkplanePart3";

/**
 * Measure beam, isotropic sky and point-luminaire light on declared workplanes,
 * preserving unsupported reflection and missing-emitter gaps.
 *
 * Scenarios:
 *
 * 1. Noon on an unobstructed horizontal plane matches beam plus sky within the
 *    existing numeric tolerance, with a daylight factor of 100% and unit
 *    uniformity and contrast.
 * 2. A different sun changes the beam by its cosine within 1e-9, and a dark
 *    instant leaves the plane at zero with the uniformity, contrast and
 *    daylight-factor gaps that a zero plane implies.
 * 3. A canopy over the plane removes the beam and the whole sky vault; a
 *    downward-facing plane loses the vault to the ground instead.
 * 4. A vertical plane sees the analytic half of the isotropic vault.
 * 5. An artificial-only study matches the inverse square law within the existing
 *    tolerance, names its domain `artificial-light`, and gaps every daylight
 *    metric as `not-run`.
 * 6. A fitting behind the plane, a fitting on the plane, and a fitting a shade
 *    stands in front of each contribute nothing, the second with a warning.
 * 7. One shaded cell of two makes uniformity zero and contrast a gap, and the
 *    field records one sample per cell.
 * 8. An unimplemented sky model is `unsupported`; a study with no sun and no
 *    fitting is `not-run`.
 * 9. Declared targets judge in the unit they are declared in; a target in another
 *    unit is dropped with a warning rather than compared across units, and a
 *    target naming a metric the study never reports is warned about too.
 * 10. Repeated requests keep their digest and the examined shade, instant and
 *     sample-count changes alter it.
 * 11. Every malformed request in the existing table is refused at its own message
 *     fragment.
 * 12. Full, half and closed sky apertures preserve the expected lux at the binary64
 *     limits, and a two-fifths aperture keeps the ordinary rounding.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the daylight solver and checks measured light, samples, report gaps, targets and refusals. Nonfinite workplane or luminaire fields must fail their own checks. Calls the sky evaluator directly so intermediate overflow or a changed ordinary arithmetic order changes its asserted lux.
 * @evidence contracts/development/testing.md#independent-expectations Geometry gives noon 1000+200 lx, oblique beam 800/sqrt(2) at 1e-9, vertical sky 100 lx within 10 lx, and a 900 cd fitting at 3 m gives 100 lx. Two literal cells 100/0 give mean 50 and zero uniformity. A tangent horizon splits the eight azimuths into four opposed pairs, giving half of MAX_VALUE. The five-ray horizon admits two rays, fixing the ordinary product-then-division result at 4e99. Full and closed apertures preserve the declared lux and zero.
 * @evidence contracts/development/common.md#meaningful-documentation Compares daylight across workplane orientation, shade, darkness and point-luminaire placement. Exercises per-cell measurements, target units, missing models, malformed inputs and extreme finite sky illuminance.
 */
export function test_analysis_daylight_workplane(): void {
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
