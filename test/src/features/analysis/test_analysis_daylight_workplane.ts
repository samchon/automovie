import { assertAnalysisDaylightWorkplanePart1 } from "../internal/assertAnalysisDaylightWorkplanePart1";
import { assertAnalysisDaylightWorkplanePart2 } from "../internal/assertAnalysisDaylightWorkplanePart2";
import { assertAnalysisDaylightWorkplanePart3 } from "../internal/assertAnalysisDaylightWorkplanePart3";
import type { IAutoMovieAnalysisMetric, IAutoMovieAnalysisRun } from "@automovie/interface";
import type { IAutoMovieAnalysisWorkplane } from "../../../../packages/engine/src/analysis/IAutoMovieAnalysisWorkplane";
import type { IAutoMovieDaylightRequest } from "../../../../packages/engine/src/analysis/IAutoMovieDaylightRequest";

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
 *
 * @evidence contracts/testing.md#behavioral-verification Calls analyzeAutoMovieDaylight through the ordered helpers and inspects measured components, per-cell positions/values, uniformity/contrast/daylight-factor states, unsupported/not-run outcomes, target warnings and refusal fragments. Incorrect cosine projection, omitted occlusion, wrong region of the measured face or division by dark samples contradicts these returned observations.
 * @evidence contracts/testing.md#independent-expectations Local geometry gives noon 1000+200 lx, oblique beam 800/sqrt(2) at 1e-9, vertical-sky 100 lx at the original 10 lx sampling tolerance, and a 900 cd fitting at 3 m gives 100 lx. The two literal cells 100/0 give mean 50 and zero uniformity. Other numeric predicates retain their original tolerances; production metric/seal/ray helpers are consumers of this simplified lighting model, not independent physical measurements or reflection certification.
 * @evidence contracts/testing.md#distinguishing-cases Retains noon/afternoon/night, canopy versus context neighbour, upward/downward/vertical normals, artificial-only/behind/coincident/occluded light, unequal cells, met/missed/wrong-unit/unknown-key targets and the full malformed-request table. Repeat/change pairs check specified digest sensitivity rather than SHA collision freedom; arbitrary sky integration error, calibrated emitters and reflected light are outside this unit.
 * @evidence contracts/testing.md#execution-ownership Portable CPU unit test_analysis_daylight_workplane is the discoverable entry and owns the ordered cases delegated to assertAnalysisDaylightWorkplanePart1, assertAnalysisDaylightWorkplanePart2, assertAnalysisDaylightWorkplanePart3; those helpers are called explicitly, with no dynamic registration, native artifact build, process, browser or GPU host.
 */
export function test_analysis_daylight_workplane(): void {
  const { upward, study, metrics, of, statusOf, noon, afternoon, shaded }: { upward: IAutoMovieAnalysisWorkplane; study: (overrides?: Partial<IAutoMovieDaylightRequest>) => IAutoMovieAnalysisRun; metrics: (run: IAutoMovieAnalysisRun) => IAutoMovieAnalysisMetric[]; of: (run: IAutoMovieAnalysisRun, key: string) => number | null; statusOf: (run: IAutoMovieAnalysisRun, key: string) => string; noon: IAutoMovieAnalysisRun; afternoon: IAutoMovieAnalysisRun; shaded: IAutoMovieAnalysisRun; } = assertAnalysisDaylightWorkplanePart1();
  assertAnalysisDaylightWorkplanePart2(upward, study, metrics, of, statusOf);
  assertAnalysisDaylightWorkplanePart3(upward, study, noon, afternoon, shaded);
}
