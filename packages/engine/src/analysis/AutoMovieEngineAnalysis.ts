import type {
  AutoMovieAnalysisComparison,
  IAutoMovieAnalysisMetric,
  IAutoMovieAnalysisMetricInput,
  IAutoMovieAnalysisReport,
  IAutoMovieAnalysisRun,
  IAutoMovieAnalysisSolid,
  IAutoMovieAnalysisTarget,
  IAutoMovieAnalyzeAcoustics,
  IAutoMovieAnalyzeDaylight,
  IAutoMovieAnalyzeEnvelope,
  IAutoMovieAnalyzeSpaceAir,
  IAutoMovieDaylightRequest,
  IAutoMovieEnvelopeRequest,
  IAutoMovieEnvironmentInstant,
  IAutoMovieHalfSpacePlane,
  IAutoMovieResolveDaylightRequest,
  IAutoMovieSealAnalysisRun,
  IAutoMovieSkyIlluminance,
  IAutoMovieSummarizeAnalysis,
  IAutoMovieValidateAnalysisRun,
  IAutoMovieValidation,
  IAutoMovieVector3,
  IAutoMovieViolationCollector,
  IAutoMovieWarnAnalysisTargetKeys,
} from "@automovie/interface";

import { analysisMetric as analysisMetricImplementation } from "./internal/analysisMetric";
import { analysisRunDigest as analysisRunDigestImplementation } from "./internal/analysisRunDigest";
import { analysisSettingsTargets as analysisSettingsTargetsImplementation } from "./internal/analysisSettingsTargets";
import { analysisTargetMet as analysisTargetMetImplementation } from "./internal/analysisTargetMet";
import { analyzeAcoustics } from "./internal/analyzeAcoustics";
import { analyzeDaylight } from "./internal/analyzeDaylight";
import { analyzeEnvelope } from "./internal/analyzeEnvelope";
import { analyzeSpaceAir } from "./internal/analyzeSpaceAir";
import { assertAnalysisSolids as assertAnalysisSolidsImplementation } from "./internal/assertAnalysisSolids";
import { assertAnalysisTargets as assertAnalysisTargetsImplementation } from "./internal/assertAnalysisTargets";
import { resolveDaylightRequest as resolveDaylightRequestImplementation } from "./internal/resolveDaylightRequest";
import { resolveEnvelopeRequest as resolveEnvelopeRequestImplementation } from "./internal/resolveEnvelopeRequest";
import { sealAnalysisRun as sealAnalysisRunImplementation } from "./internal/sealAnalysisRun";
import { skyIlluminance as skyIlluminanceImplementation } from "./internal/skyIlluminance";
import { summarizeAnalysis as summarizeAnalysisImplementation } from "./internal/summarizeAnalysis";
import { validateAnalysisRun as validateAnalysisRunImplementation } from "./internal/validateAnalysisRun";
import { validateAnalysisRunContents as validateAnalysisRunContentsImplementation } from "./internal/validateAnalysisRunContents";
import { validateSolidPlanes as validateSolidPlanesImplementation } from "./internal/validateSolidPlanes";
import { warnAnalysisTargetKeys as warnAnalysisTargetKeysImplementation } from "./internal/warnAnalysisTargetKeys";

/**
 * Deterministic analyses for declared acoustic, daylight, envelope and air
 * studies.
 */
export namespace AutoMovieEngineAnalysis {
  /**
   * Build a finite measured metric or record a measurement gap.
   *
   * Null requires a reason and remedy and defaults to not-run. A measured value
   * requires a finite number and an absent gap. Pass admitted targets. The
   * first matching key with the same unit determines the verdict. A unit
   * mismatch appends a warning and yields an untargeted metric.
   */
  export function analysisMetric(
    props: IAutoMovieAnalysisMetricInput.IProps,
  ): IAutoMovieAnalysisMetric {
    return analysisMetricImplementation(props);
  }

  /**
   * Solve a room's broadband reverberation, receiver levels and partition
   * transmission.
   *
   * The Sabine time is 0.161 times the room volume divided by the sum of
   * surface area times absorption. At each receiver, direct and diffuse energy
   * add before conversion to decibels. Partition transmission uses
   * area-weighted power, so a weaker panel can dominate the result.
   *
   * A room with zero or complete absorption cannot supply a diffuse-field
   * measurement. The level metrics and receiver samples are unavailable when
   * any receiver's energy underflows or overflows. Speech transmission index is
   * unsupported. A run with available levels has one sample per receiver.
   *
   * Malformed requests throw. A receiver at most 1e-12 metres from any source
   * also throws.
   */
  export function acoustics(
    props: IAutoMovieAnalyzeAcoustics.IProps,
  ): IAutoMovieAnalysisRun {
    return analyzeAcoustics(props);
  }

  /**
   * Measure direct sun, isotropic sky and point luminaires on one workplane.
   *
   * Beam illuminance projects direct normal illuminance onto the plane. Sky
   * illuminance scales diffuse horizontal illuminance by the visible fraction
   * of cosine-weighted hemispherical directions. A luminaire contributes
   * intensity times the incident cosine divided by squared distance. Shades can
   * block each path.
   *
   * An unobstructed upward-facing plane sees the full sky. A tilted or shaded
   * plane uses the requested sampling count. Ground reflection is unsupported.
   * An unsupported sky model yields an unsupported run, and a study with
   * neither a named instant nor a fitting yields a not-run result.
   *
   * A dark minimum leaves the contrast undefined. Computed numeric overflow can
   * throw even for finite admitted inputs.
   */
  export function daylight(
    props: IAutoMovieAnalyzeDaylight.IProps,
  ): IAutoMovieAnalysisRun {
    return analyzeDaylight(props);
  }

  /**
   * Estimate steady-state heat transfer and surface condensation as two runs
   * with the same settings.
   *
   * Series resistance adds the two films and every layer's thickness divided by
   * conductivity. The indoor-outdoor temperature difference multiplies the sum
   * of assembly area divided by resistance and bridge length times linear
   * transmittance. The surface temperature follows the interior film drop.
   *
   * An interior surface at or below the indoor Magnus dew point is at risk of
   * condensation. At zero humidity the dew point is unavailable. Solar gain and
   * interstitial condensation are unsupported. Without an outdoor design
   * temperature, both runs have status `not-run`.
   *
   * Malformed input and nonfinite computed measurements throw. The Magnus
   * approximation can extrapolate outside its fit, and finite admitted inputs
   * can still exceed the arithmetic range.
   */
  export function envelope(
    props: IAutoMovieAnalyzeEnvelope.IProps,
  ): IAutoMovieAnalyzeEnvelope.IResult {
    return analyzeEnvelope(props);
  }

  /**
   * Estimate ventilation and steady-state carbon dioxide for a well-mixed zone.
   *
   * The air change rate is 3,600 times supply flow divided by room volume.
   * Outdoor flow per person is 1,000 times supply flow divided by occupancy.
   * Steady-state parts per million add outdoor concentration to one million
   * times total occupant generation divided by supply flow.
   *
   * Missing supply flow leaves a gap in flow-dependent measurements, and zero
   * occupancy leaves per-person flow undefined. At zero flow, the concentration
   * gap distinguishes ongoing generation from no unique steady state.
   * Stagnation and velocity fields are unsupported. The run has no spatial
   * samples.
   *
   * Malformed input or nonfinite computed measurements throw.
   */
  export function spaceAir(
    props: IAutoMovieAnalyzeSpaceAir.IProps,
  ): IAutoMovieAnalysisRun {
    return analyzeSpaceAir(props);
  }

  /**
   * Validate half-space fields and unique IDs within one list of analysis
   * blockers.
   *
   * Solids are checked in order. A repeated ID or the first plane violation
   * throws with the supplied label and field path. Half-space field admission
   * leaves geometric boundedness and feasibility to the caller.
   */
  export function assertAnalysisSolids(
    solids: readonly IAutoMovieAnalysisSolid[],
    label: string,
  ): void {
    assertAnalysisSolidsImplementation(solids, label);
  }

  /**
   * Admit a study's declared target list before solving.
   *
   * Each target requires a nonblank key and unit, a finite value, and at-least
   * or at-most comparison. Keys must be unique. The first offending declaration
   * throws in authored order.
   */
  export function assertAnalysisTargets(
    targets: readonly IAutoMovieAnalysisTarget[],
  ): void {
    assertAnalysisTargetsImplementation(targets);
  }

  /**
   * Compute the automovie.analysis-run.v1 SHA-256 digest of supplied run
   * contents.
   *
   * The input is an already shaped analysis record. Encoding uses fixed-field
   * JSON-array lines: the header, then metrics, samples and warnings in stored
   * order for a solved outcome, or reason and remedy for a refused outcome. An
   * existing digest field is ignored.
   *
   * The result has the `sha256:` prefix followed by lowercase hexadecimal
   * digits. JSON scalar spelling is part of the archive, including a single
   * spelling for signed zero.
   */
  export function analysisRunDigest(
    run: Omit<IAutoMovieAnalysisRun, "digest">,
  ): IAutoMovieAnalysisRun["digest"] {
    return analysisRunDigestImplementation(run);
  }

  /**
   * Project admitted targets into the analyzer's settings record.
   *
   * Return new records containing key, unit, value and comparison in that field
   * order. The authored target-list order is preserved.
   */
  export function analysisSettingsTargets(
    targets: readonly IAutoMovieAnalysisTarget[],
  ): IAutoMovieAnalysisTarget[] {
    return analysisSettingsTargetsImplementation(targets);
  }

  /**
   * Compare a finite measured value with a finite target in the same unit.
   *
   * At-least means value ≥ target. At-most means value ≤ target. Equality meets
   * either comparison.
   */
  export function analysisTargetMet(
    value: number,
    target: number,
    comparison: AutoMovieAnalysisComparison,
  ): boolean {
    return analysisTargetMetImplementation(value, target, comparison);
  }

  /**
   * Validate a daylight request and return its named instant and workplane
   * frame.
   *
   * The frame contains normalized in-plane axes and their normalized
   * right-handed cross product. Axes must have finite components and form a
   * nondegenerate plane. Workplane sizes must be finite and positive, grid and
   * diffuse counts must be positive safe integers, and the grid must fit a
   * run's sample bound.
   *
   * The named instant is the context's own record, or null when the request
   * leaves it unset. Duplicate light IDs, nonfinite or negative intensities,
   * malformed shades and invalid targets throw alongside invalid context and
   * workplane fields.
   */
  export function resolveDaylightRequest(
    request: IAutoMovieDaylightRequest,
  ): IAutoMovieResolveDaylightRequest.IResult {
    return resolveDaylightRequestImplementation(request);
  }

  /**
   * Validate an envelope request and return the selected context instant, or
   * null when none is named.
   *
   * Indoor relative humidity must be in the closed interval from zero to one.
   * Assembly areas, film resistances, layer thicknesses and conductivities, and
   * bridge lengths must be finite and positive. Linear transmittance must be
   * finite and nonnegative.
   *
   * IDs are unique within each list and each bridge must reference a declared
   * assembly. Invalid context, instant, header, assembly, bridge or target
   * fields throw at admission.
   */
  export function resolveEnvelopeRequest(
    request: IAutoMovieEnvelopeRequest,
  ): IAutoMovieEnvironmentInstant | null {
    return resolveEnvelopeRequestImplementation(request);
  }

  /**
   * Seal a typed run with its settings digest and content digest.
   *
   * Hash the settings text and admit the run contents before sealing. A refused
   * run throws with its ID and first field finding. The returned run borrows
   * solver and outcome records, so editing a covered field can invalidate its
   * seal.
   */
  export function sealAnalysisRun(
    props: IAutoMovieSealAnalysisRun.IProps,
  ): IAutoMovieAnalysisRun {
    return sealAnalysisRunImplementation(props);
  }

  /**
   * Roll up sealed analysis runs for one design revision.
   *
   * Supply a nonblank revision and at least one required domain. An invalid or
   * repeated run throws. Stale, unavailable or unmeasured results become gaps,
   * as do missing required domains. A missed target takes precedence over gaps,
   * and gaps yield incomplete when there are no misses.
   *
   * The gap maximum defaults to 16 and must be a positive safe integer. The
   * report lists gaps in run and metric order before missing domains in
   * domain-table order, counts omitted gaps and seals the listed report.
   */
  export function summarizeAnalysis(
    props: IAutoMovieSummarizeAnalysis.IProps,
  ): IAutoMovieAnalysisReport {
    return summarizeAnalysisImplementation(props);
  }

  /**
   * Check a typed analysis run, its content seal and an optional revision.
   *
   * Findings are rooted at $input. The operation checks run contents, then the
   * lowercase SHA-256 digest and its match, then the optional revision. A
   * revision mismatch reports the record as stale.
   */
  export function validateAnalysisRun(
    props: IAutoMovieValidateAnalysisRun.IProps,
  ): IAutoMovieValidation {
    return validateAnalysisRunImplementation(props);
  }

  /**
   * Append semantic findings for the contents of a typed analysis run.
   *
   * The caller owns the collector and checks the run seal separately. The
   * header, settings and outcome are checked in field order. Measured values,
   * judged targets, sample positions and sample values must be finite. A null
   * metric value requires a gap and carries no target.
   *
   * A solved run requires a metric and at most 4,096 samples. Each sample names
   * a measured metric from the same run. Use the enclosing schema gate to admit
   * the nested record shape first.
   */
  export function validateAnalysisRunContents(
    run: Omit<IAutoMovieAnalysisRun, "digest">,
    out: IAutoMovieViolationCollector,
  ): void {
    validateAnalysisRunContentsImplementation(run, out);
  }

  /**
   * Append field violations for the planes of one convex blocker to the
   * caller's sink.
   *
   * Each plane represents dot(normal, point) at or below offset. The array must
   * contain at least AutoMovieEngineAnalysisMinSolidPlanes slots. Each slot
   * must hold a record with a finite offset and a finite normal length above
   * 1e-12.
   *
   * Findings use the supplied path and label. This field validation leaves
   * geometric feasibility and boundedness to the caller.
   */
  export function validateSolidPlanes(
    planes: readonly IAutoMovieHalfSpacePlane[],
    path: string,
    label: string,
    out: IAutoMovieViolationCollector,
  ): void {
    validateSolidPlanesImplementation(planes, path, label, out);
  }

  /**
   * Append a target-key-unknown warning for each unmatched target, in declared
   * order.
   *
   * Supply every metric key the study reports, including metrics with no
   * measured value and keys from each run of a multi-run study. A matched gap
   * remains visible in its own metric.
   */
  export function warnAnalysisTargetKeys(
    props: IAutoMovieWarnAnalysisTargetKeys.IProps,
  ): void {
    warnAnalysisTargetKeysImplementation(props);
  }
  /**
   * Prepare an isotropic sky contribution and return a function that measures
   * it at a world point.
   *
   * The function scales diffuse horizontal illuminance by the fraction of all
   * sampled directions that are above the reference ground and remain
   * unobstructed. Every direction counts in the denominator. An unobstructed
   * upward-facing plane sees the full sky, while tilted and shaded planes use a
   * finite estimate.
   *
   * If multiplying a finite illuminance by the visible count overflows, the
   * function multiplies by the visible fraction instead.
   *
   * Direction count and plane normal follow the hemisphere sampler's input
   * domain.
   */
  export function skyIlluminance(
    props: IAutoMovieSkyIlluminance.IProps,
  ): (point: IAutoMovieVector3) => number {
    return skyIlluminanceImplementation(props);
  }
}
