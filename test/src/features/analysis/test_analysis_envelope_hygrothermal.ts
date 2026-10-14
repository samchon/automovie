import type {
  IAutoMovieAnalysisMetric,
  IAutoMovieAnalysisRun,
} from "@automovie/interface";

import type { IAutoMovieEnvelopeAssembly } from "@automovie/engine";
import type { IAutoMovieEnvelopeRequest } from "@automovie/engine";
import type { IAutoMovieSpaceAirRequest } from "@automovie/engine";
import { assertAnalysisEnvelopeHygrothermalPart1 } from "../internal/assertAnalysisEnvelopeHygrothermalPart1";
import { assertAnalysisEnvelopeHygrothermalPart2 } from "../internal/assertAnalysisEnvelopeHygrothermalPart2";
import { assertAnalysisEnvelopeHygrothermalPart3 } from "../internal/assertAnalysisEnvelopeHygrothermalPart3";

/**
 * Solve declared series thermal resistances and well-mixed ventilation, keeping condensation, absent boundaries and unsupported fields distinct.
 *
 * Scenarios:
 * 1. The declared envelope produces the hand-computed transmittance, heat loss, bridge share, temperature factor and surface temperatures, one field sample per assembly.
 * 2. Solar gain is `unsupported` inside a solved thermal run, and interstitial condensation is `unsupported` inside a solved moisture run.
 * 3. The dew point is the Magnus value, the condensation margins follow it, and raising the indoor humidity puts exactly the coldest surface at risk.
 * 4. Indoor air at the outdoor temperature has zero heat loss, a gapped bridge share, surface temperature 5 and the reverse-heat-flow warning code.
 * 5. Air at zero relative humidity has no dew point, so every moisture metric gaps and the field is empty.
 * 6. A study with no instant, and a study whose instant declares no outdoor temperature, are both `not-run` naming the missing boundary condition.
 * 7. Ventilation matches the stated air changes, outdoor air per person and steady-state contaminant balance within the existing numeric tolerances, and reports air speed and stagnation as `unsupported`.
 * 8. A space with no supply flow, no occupants, or a supply flow of zero gaps the metric that needs it instead of dividing by it, and a zero flow's reason says the concentration accumulates when occupants generate carbon dioxide and is undetermined when nothing does.
 * 9. A target no run of the study reports is stated on every run of it, while a moisture-keyed target is matched by the moisture run rather than counted unmatched by the thermal one.
 * 10. Every malformed envelope and ventilation request in the existing table is refused at its own message fragment.
 * 11. The exported dew point refuses air that has no dew point.
 *
 * @evidence contracts/testing.md#behavioral-verification Executes analyzeAutoMovieEnvelope, analyzeAutoMovieSpaceAir and direct autoMovieDewPoint calls through the ordered parts. Returned thermal/moisture metrics, assembly sample values, risk ids, warning codes, target verdicts and gaps distinguish solved arithmetic from missing boundaries; all existing malformed-input callbacks must throw their stated fragments.
 * @evidence contracts/testing.md#independent-expectations Authored wall/glazing resistances 1/0.8 give fabric 12.5 W/K, bridge 2 W/K and heat loss 290 W at 20 K; local surface values 18/17.5 and area weighting determine means and margins. The stated Magnus coefficients supply rounded 9.2552/17.9501 dew-point references and an algebraic inverse margin reference with original 1e-3/1e-4/1e-9 limits. Zone equations give 1.8 changes/hour, 12.5 L/s/person and 800 ppm independently of returned metrics. Shared metric/seal admission is not physical validation, and transient heat, vapour diffusion and a spatial flow field are not observed.
 * @evidence contracts/testing.md#distinguishing-cases Preserves ordinary/high humidity, equal temperatures, zero humidity, absent instant/temperature, present/null/zero flow, zero occupants/generation, met/missed targets, unknown keys across both domains and the full malformed-request table, including direct saturated-air identity. These cases retain every input and tolerance without claiming all finite extremes or external room measurements.
 * @evidence contracts/testing.md#execution-ownership Portable CPU unit test_analysis_envelope_hygrothermal is the discoverable entry and owns the ordered cases delegated to assertAnalysisEnvelopeHygrothermalPart1, assertAnalysisEnvelopeHygrothermalPart2, assertAnalysisEnvelopeHygrothermalPart3; those helpers are called explicitly, with no dynamic registration, native artifact build, process, browser or GPU host.
 */
export function test_analysis_envelope_hygrothermal(): void {
  const {
    wall,
    study,
    metrics,
    of,
    statusOf,
    bone,
  }: {
    wall: IAutoMovieEnvelopeAssembly;
    study: (overrides?: Partial<IAutoMovieEnvelopeRequest>) => {
      thermal: IAutoMovieAnalysisRun;
      moisture: IAutoMovieAnalysisRun;
    };
    metrics: (run: IAutoMovieAnalysisRun) => IAutoMovieAnalysisMetric[];
    of: (run: IAutoMovieAnalysisRun, key: string) => number | null;
    statusOf: (run: IAutoMovieAnalysisRun, key: string) => string;
    bone: { thermal: IAutoMovieAnalysisRun; moisture: IAutoMovieAnalysisRun };
  } = assertAnalysisEnvelopeHygrothermalPart1();
  const {
    air,
  }: {
    air: (
      overrides?: Partial<IAutoMovieSpaceAirRequest>,
    ) => IAutoMovieAnalysisRun;
  } = assertAnalysisEnvelopeHygrothermalPart2(
    study,
    metrics,
    of,
    statusOf,
    bone,
  );
  assertAnalysisEnvelopeHygrothermalPart3(wall, study, air);
}
