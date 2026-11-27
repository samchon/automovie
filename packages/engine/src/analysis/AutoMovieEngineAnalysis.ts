import { assertAutoMovieAnalysisSolids as assertAutoMovieAnalysisSolidsImplementation } from "./internal/assertAutoMovieAnalysisSolids";
import { assertAutoMovieAnalysisTargets as assertAutoMovieAnalysisTargetsImplementation } from "./internal/assertAutoMovieAnalysisTargets";
import { autoMovieAnalysisRunDigest as autoMovieAnalysisRunDigestImplementation } from "./internal/autoMovieAnalysisRunDigest";
import { autoMovieAnalysisSettingsTargets as autoMovieAnalysisSettingsTargetsImplementation } from "./internal/autoMovieAnalysisSettingsTargets";
import { autoMovieAnalysisTargetMet as autoMovieAnalysisTargetMetImplementation } from "./internal/autoMovieAnalysisTargetMet";
import { resolveAutoMovieDaylightRequest as resolveAutoMovieDaylightRequestImplementation } from "./internal/resolveAutoMovieDaylightRequest";
import { resolveAutoMovieEnvelopeRequest as resolveAutoMovieEnvelopeRequestImplementation } from "./internal/resolveAutoMovieEnvelopeRequest";
import { sealAutoMovieAnalysisRun as sealAutoMovieAnalysisRunImplementation } from "./internal/sealAutoMovieAnalysisRun";
import { summarizeAutoMovieAnalysis as summarizeAutoMovieAnalysisImplementation } from "./internal/summarizeAutoMovieAnalysis";
import { validateAutoMovieAnalysisRun as validateAutoMovieAnalysisRunImplementation } from "./internal/validateAutoMovieAnalysisRun";
import { validateAutoMovieAnalysisRunContents as validateAutoMovieAnalysisRunContentsImplementation } from "./internal/validateAutoMovieAnalysisRunContents";
import { validateSolidPlanes as validateSolidPlanesImplementation } from "./internal/validateSolidPlanes";
import { warnAutoMovieAnalysisTargetKeys as warnAutoMovieAnalysisTargetKeysImplementation } from "./internal/warnAutoMovieAnalysisTargetKeys";
import { autoMovieAnalysisMetric as autoMovieAnalysisMetricImplementation } from "./internal/autoMovieAnalysisMetric";
import type {
  IAutoMovieAnalysisMetric,
  IAutoMovieAnalysisMetricInput,
  IAutoMovieAnalysisRun,
  IAutoMovieAnalyzeAcoustics,
  IAutoMovieAnalyzeDaylight,
  IAutoMovieAnalyzeEnvelope,
  IAutoMovieAnalyzeSpaceAir,
  IAutoMovieAnalysisSolid,
  IAutoMovieAnalysisTarget,
  AutoMovieAnalysisComparison,
  IAutoMovieResolveDaylightRequest,
  IAutoMovieDaylightRequest,
  IAutoMovieEnvironmentInstant,
  IAutoMovieEnvelopeRequest,
  IAutoMovieSealAnalysisRun,
  IAutoMovieAnalysisReport,
  IAutoMovieSummarizeAnalysis,
  IAutoMovieValidation,
  IAutoMovieValidateAnalysisRun,
  IAutoMovieViolationCollector,
  IAutoMovieHalfSpacePlane,
  IAutoMovieWarnAnalysisTargetKeys,
  IAutoMovieSkyIlluminance,
  IAutoMovieVector3,
} from "@automovie/interface";



import { analyzeAutoMovieAcoustics } from "./internal/analyzeAutoMovieAcoustics";
import { analyzeAutoMovieDaylight } from "./internal/analyzeAutoMovieDaylight";
import { analyzeAutoMovieEnvelope } from "./internal/analyzeAutoMovieEnvelope";
import { analyzeAutoMovieSpaceAir } from "./internal/analyzeAutoMovieSpaceAir";
import { autoMovieSkyIlluminance as autoMovieSkyIlluminanceImplementation } from "./internal/autoMovieSkyIlluminance";

/** Deterministic analyses for declared acoustic, daylight, envelope and air studies. */
export namespace AutoMovieEngineAnalysis {
  /** Build one metric, resolving its authored target or recording its absence. */
  export function analysisMetric(props: IAutoMovieAnalysisMetricInput.IProps): IAutoMovieAnalysisMetric {
    return autoMovieAnalysisMetricImplementation(props);
  }

  /**
   * Solve one room for reverberation, equipment noise and partition performance.
   *
   * Three closed forms, each stated so a reader can check the arithmetic:
   *
   * - The Sabine absorption `A = sum(S * alpha)` and `T60 = 0.161 * V / A`;
   * - The room constant `R = A / (1 - alpha_mean)`, and at each receiver `Lp = 10 *
   *   log10(sum over sources of 10^(Lw/10) * (Q / (4*pi*r^2) + 4/R))`, the direct
   *   field plus the diffuse field;
   * - The composite transmission loss `R_c = -10 * log10(sum(tau * S) / sum(S))`
   *   with `tau = 10^(-R/10)`, which is why one weak panel dominates a strong
   *   wall.
   *
   * The exclusions are stated as loudly as the results. A single broadband
   * absorption coefficient cannot produce a speech transmission index, which
   * needs a modulation transfer function over an impulse response, so that metric
   * is `unsupported` rather than estimated.
   *
   * The reverberation time, the room constant and the receiver level are all
   * statements about a diffuse field, so all three gap wherever there is none: a
   * room that absorbs nothing rings forever, and a room that absorbs everything
   * never rings at all. Neither extreme is reported as a number. The second is
   * the one worth naming, because Sabine does not diverge there but keeps
   * returning `0.161 * V / A`, a positive decay time for an anechoic chamber,
   * which is the arithmetic of the model rather than a property of the room.
   *
   * A receiver whose energy underflows to zero or overflows to infinity in double
   * precision has no level, so the level metrics gap with a reason naming which
   * bound was crossed.
   *
   * Throws on a malformed request (see {@link IAutoMovieAcousticRequest}), on a
   * receiver within `1e-12` m of a source, and when the sealed run would fail
   * validation; otherwise the run is always `solved`, with one sound-pressure
   * sample per receiver when a level exists.
   */
  export function acoustics(
    props: IAutoMovieAnalyzeAcoustics.IProps,
  ): IAutoMovieAnalysisRun {
    return analyzeAutoMovieAcoustics(props);
  }

  /**
   * Measure one workplane under one declared instant, one set of shades and one
   * set of luminaires.
   *
   * The governing model is stated and bounded rather than implied:
   *
   * - Beam illuminance is `DNI * max(0, dot(n, s))`, zeroed when any solid stops
   *   the ray to the sun;
   * - Sky illuminance is the isotropic vault `DHI * V`, where `V` is the fraction
   *   of a cosine-weighted hemisphere that reaches the sky unobstructed and above
   *   the reference ground. An unobstructed ground-facing-up plane has V=1;
   *   tilted or shaded planes retain sampling error;
   * - Each luminaire contributes `I * max(0, dot(n, d)) / r^2`, zeroed when a solid
   *   stands between the fitting and the point;
   * - Ground-reflected light is **not** modelled, and says so as an `unsupported`
   *   metric rather than being quietly folded into the sky term.
   *
   * Anything the solver cannot answer is reported rather than approximated. A sky
   * model it does not implement returns an `unsupported` run; a study with
   * neither a sun nor a fitting returns `not-run`; a contrast ratio over a plane
   * with a dark point returns a gap, because `max / 0` is not a large number, it
   * is not a number.
   *
   * Settings text covers the declared study fields and preserves list order;
   * equivalent covered JSON values repeat the digest, while ignored fields,
   * signed zero and possible hash collisions limit identity claims.
   *
   * The cosine-weighted sky estimate is exact only for an unobstructed plane
   * whose hemisphere lies wholly above the reference ground; a tilted or shaded
   * plane's sky term depends on `diffuseSamples`. This identity is mathematical:
   * binary64 light products and summation can overflow, and nonfinite computed
   * metrics throw even when scalar inputs were admitted.
   */
  export function daylight(
    props: IAutoMovieAnalyzeDaylight.IProps,
  ): IAutoMovieAnalysisRun {
    return analyzeAutoMovieDaylight(props);
  }

  /**
   * Solve one envelope for heat and for surface condensation, as two runs.
   *
   * Two runs rather than one because heat and moisture are two domains a report
   * rolls up separately: a wall may be warm enough and still wet, and one merged
   * verdict would let either fact hide the other. Both read the same inputs and
   * carry the same settings digest, so they are provably about the same
   * envelope.
   *
   * The governing model is the one-dimensional steady-state network, stated
   * exactly:
   *
   * - `R = Rsi + sum(t / lambda) + Rse`, and `U = 1 / R`;
   * - The interior surface sits at `Tsi = Ti - U * Rsi * (Ti - Te)`, so the
   *   temperature factor `fRsi = (Tsi - Te) / (Ti - Te)` reduces exactly to `1 -
   *   U*Rsi` and needs no temperatures at all;
   * - Fabric loss is `sum(U * A) * dT` and linear bridges add `sum(psi * L) * dT`;
   * - The dew point comes from `autoMovieDewPoint`, the Magnus form, and surface
   *   condensation is `Tsi <= Td`.
   *
   * What it does not do, it says. Condensation inside the build-up, which needs
   * vapour diffusion, and solar gain through glazing each appear as an
   * `unsupported` metric with the exact reason, because an envelope study that
   * quietly omitted them would read as a complete answer. Transient storage is
   * excluded by the steady-state model itself, which the solver's model text
   * states.
   *
   * Without an exterior boundary condition there is no answer at all, and both
   * runs come back `not-run` naming the missing input rather than assuming a
   * temperature nobody declared.
   *
   * The Magnus coefficients are fitted over roughly -45 to 60 degC, and an indoor
   * temperature outside that range is not refused. Throws on malformed requests
   * or a nonfinite computed metric; finite positive fields alone do not prevent
   * resistance/temperature overflow, underflow or dew-point singularities.
   */
  export function envelope(
    props: IAutoMovieAnalyzeEnvelope.IProps,
  ): IAutoMovieAnalyzeEnvelope.IResult {
    return analyzeAutoMovieEnvelope(props);
  }

  /**
   * Solve one space for ventilation, and refuse to pretend it solved the air.
   *
   * What a well-mixed zone model can answer, it answers exactly: the air change
   * rate `n = 3600 * Q / V`, the outdoor air per person `1000 * Q / N`, and the
   * steady-state contaminant balance `C = Co + 1e6 * N * G / Q`. Those are
   * closed-form and are checked against hand arithmetic.
   *
   * What it cannot answer, it refuses to. Air stagnation and a velocity field are
   * properties of a flow solution, and no amount of zone arithmetic produces one,
   * so both are `unsupported` metrics naming exactly what is missing. This is the
   * whole point of the contract: the honest answer to "where does the air sit
   * still" is that this host does not know, and a number invented here would be
   * indistinguishable from one that was computed.
   *
   * A zero supply flow leaves the steady-state concentration a gap whose reason
   * depends on the generation `N * G`: with occupants generating carbon dioxide
   * it rises without bound, and with none it stays wherever it starts, so no
   * steady state is unique either way.
   *
   * Throws on a malformed request (see {@link IAutoMovieSpaceAirRequest}). The
   * returned run is always `solved` and carries no spatial samples.
   *
   * Finite admitted inputs can still overflow or underflow intermediate
   * arithmetic; a nonfinite metric throws through the shared builder instead of
   * becoming a fabricated measurement.
   */
  export function spaceAir(
    props: IAutoMovieAnalyzeSpaceAir.IProps,
  ): IAutoMovieAnalysisRun {
    return analyzeAutoMovieSpaceAir(props);
  }

  /**
   * Refuse malformed blocker identifiers and half-space fields.
   *
   * The rule is {@link validateSolidPlanes}, raised to a throw: an adapter reading
   * an authored shading solid has no honest result to return for a solid with no
   * faces, so it stops rather than producing one. Sharing the rule is what keeps
   * a neighbour's mass and the building's own canopy held to one standard.
   *
   * Throws an `Error` at the first id repeated within `solids`, or the first
   * plane violation of a solid, naming that solid and the violation path. `label`
   * names the kind of solid in every message and path, and ids need to be unique
   * only within this one list.
   *
   * Plane count and finite fields do not prove the intersection bounded or
   * nonempty; validateSolidPlanes deliberately leaves those geometric properties
   * unchecked.
   *
   * @param solids Authored convex blockers, checked in list order.
   * @param label Kind of solid named in messages and paths, such as `shading
   *   solid`.
   */
  export function assertAnalysisSolids(solids: readonly IAutoMovieAnalysisSolid[], label: string): void {
    assertAutoMovieAnalysisSolidsImplementation(solids, label);
  }

  /**
   * Check the targets a production declares before any solver reads them.
   *
   * Targets are the one input that can turn a correct measurement into a wrong
   * verdict, so they are refused at the door rather than negotiated later: a
   * blank key, a blank unit, a non-finite value, an unknown direction, or two
   * targets fighting over the same key are all authoring mistakes with no sane
   * interpretation.
   *
   * Throws an `Error` naming the first offending target in list order. Whether a
   * key names a metric the study reports is not checked here;
   * `warnAutoMovieAnalysisTargetKeys` reports that after the metrics exist.
   *
   * @param targets Targets one study declares, in authored order.
   */
  export function assertAnalysisTargets(targets: readonly IAutoMovieAnalysisTarget[]): void {
    assertAutoMovieAnalysisTargetsImplementation(targets);
  }

  /**
   * The digest that seals one run's contents.
   *
   * Exported because a run that arrived as JSON has to be checkable by the same
   * rule that produced it, and because a second implementation of the canonical
   * form would be a second answer to what a run says.
   *
   * The digest is a `sha256:` lowercase hex string over a canonical text with one
   * JSON array per line: the header (protocol, version, id, domain, subject,
   * input revision, the three solver fields, settings digest and outcome status),
   * then one line per metric, sample and warning in their stored order, or one
   * line holding a refused outcome's reason and remedy. JSON escapes every
   * newline and separator inside a string, so two runs that differ in any covered
   * encoded JSON value produce different text. JSON normalizes signed zero and
   * writes nonfinite numbers as null; hash collisions are possible. Reordering
   * distinct metrics, samples or warnings changes the digest.
   *
   * @param run Run contents; a `digest` field, if present, is not read.
   * @returns The `sha256:` digest of the canonical text.
   */
  export function analysisRunDigest(run: Omit<IAutoMovieAnalysisRun, "digest">): IAutoMovieAnalysisRun["digest"] {
    return autoMovieAnalysisRunDigestImplementation(run);
  }

  /**
   * The declared targets as they enter an analyzer's settings text.
   *
   * Each target is copied to exactly its four contract fields, `key`, `unit`,
   * `value` and `comparison`, in that order and in list order. Extra runtime
   * properties and original property order are ignored; changes to covered JSON
   * values change the settings text, while signed zeros share an encoding and a
   * digest is not a collision-free identity proof.
   *
   * @param targets Targets the study declares, already checked.
   * @returns New records holding only the four contract fields.
   */
  export function analysisSettingsTargets(targets: readonly IAutoMovieAnalysisTarget[]): IAutoMovieAnalysisTarget[] {
    return autoMovieAnalysisSettingsTargetsImplementation(targets);
  }

  /**
   * Whether a measured value satisfies a target in the declared direction.
   *
   * `at-least` holds when `value >= target` and `at-most` when `value <= target`,
   * so a value exactly on the target meets it either way. Both numbers are in the
   * same unit; no conversion or tolerance is applied.
   *
   * @param value Finite measured value.
   * @param target Finite target value in the same unit.
   * @param comparison Direction the target is judged in.
   * @returns `true` for `meets`, `false` for `misses`.
   */
  export function analysisTargetMet(value: number, target: number, comparison: AutoMovieAnalysisComparison): boolean {
    return autoMovieAnalysisTargetMetImplementation(value, target, comparison);
  }

  /**
   * Refuse a daylight request no honest study can be made from, and resolve the
   * instant and the workplane frame it names.
   *
   * Authoring mistakes throw rather than becoming an `unsupported` run: an
   * unsupported run is a true statement about the host's capability, and using it
   * for a degenerate grid would turn a bug report into a capability claim. The
   * refused inputs are those {@link IAutoMovieDaylightRequest} lists, checked in
   * field order, and the first one throws an `Error` naming it.
   *
   * The returned axes are the normalized workplane axes, and the normal is their
   * normalized right-handed cross product, the face the study measures. The
   * instant is the context's own record, or `null` when the request names none.
   *
   * @param request Daylight or artificial-light study to check.
   * @returns The resolved instant and the unit frame of the workplane.
   */
  export function resolveDaylightRequest(request: IAutoMovieDaylightRequest): IAutoMovieResolveDaylightRequest.IResult {
    return resolveAutoMovieDaylightRequestImplementation(request);
  }

  /**
   * Refuse an envelope request no honest study can be made from, and resolve the
   * instant it names.
   *
   * The refused inputs are those {@link IAutoMovieEnvelopeRequest} lists, checked
   * in field order: header strings, the context, the instant, the indoor air, the
   * assemblies with their films, area, position and layers, the bridges, and the
   * targets. The first one throws an `Error` naming it. Ids must be unique within
   * their own list, and a bridge must run along a declared assembly.
   *
   * @param request Envelope study to check.
   * @returns The context's own instant record, or `null` when the request names
   *   none.
   */
  export function resolveEnvelopeRequest(request: IAutoMovieEnvelopeRequest): IAutoMovieEnvironmentInstant | null {
    return resolveAutoMovieEnvelopeRequestImplementation(request);
  }

  /**
   * Seal one run: digest the settings, check the record, and digest it only once
   * it is known to validate.
   *
   * Building and checking are the same call on purpose. A builder that can hand
   * back an invalid artifact is a hole in exactly the contract this module exists
   * to hold, so the seal applies the same contents rules a deserialized run faces
   * (`validateAutoMovieAnalysisRunContents`) and throws on the first violation
   * rather than shipping it. The error names the run id and the first violation's
   * path and expectation. The digest it then writes is the one
   * `validateAutoMovieAnalysisRun` recomputes, so the sealed run validates.
   *
   * The settings text is kept only as its SHA-256 digest. The returned run holds
   * the caller's `solver` and `outcome` objects by reference rather than copying
   * them, so editing a covered field after sealing generally breaks digest
   * agreement; unencoded extra fields and numerically equivalent signed zeros do
   * not change the canonical text, and a digest is not a collision-free identity
   * proof.
   */
  export function sealAnalysisRun(props: IAutoMovieSealAnalysisRun.IProps): IAutoMovieAnalysisRun {
    return sealAutoMovieAnalysisRunImplementation(props);
  }

  /**
   * Roll every run of one design revision into one bounded verdict.
   *
   * The report cannot be cleared by silence. A required domain nobody submitted a
   * run for becomes a gap of its own; a run that read a superseded revision is
   * counted as stale rather than as an answer; a metric that produced no value
   * carries its reason up. Only when every required domain answered against this
   * revision, every metric produced a value, and every judged metric met its
   * target does the status read `meets`.
   *
   * Declaring at least one required domain is mandatory, which is what removes
   * the last way to pass: a report over nothing would otherwise clear
   * everything.
   *
   * Gaps come from every submitted run, whether or not its domain is required.
   * Any `misses` metric makes the status `misses`; otherwise any gap makes it
   * `incomplete`. Gaps are ordered by run and by metric within a run, then by
   * missing required domain in domain-table order; the first `maxGaps` of that
   * list are listed and the rest only counted. The digest is SHA-256 over one
   * JSON array per line (header, each rollup, each listed gap, then the omitted
   * count), so it covers the listed gaps and that count but not the text of the
   * omitted ones.
   *
   * Throws on a blank revision, a gap bound that is not a positive safe integer,
   * an empty required domain, a run that fails validation, and a run id reported
   * twice.
   */
  export function summarizeAnalysis(props: IAutoMovieSummarizeAnalysis.IProps): IAutoMovieAnalysisReport {
    return summarizeAutoMovieAnalysisImplementation(props);
  }

  /**
   * Validate one analysis run as evidence.
   *
   * The contents follow `validateAutoMovieAnalysisRunContents`: an absent
   * measurement must stay visibly absent, and a spatial sample may only field a
   * metric that produced a value. On top of that the digest is recomputed, so a
   * run whose outcome was edited after sealing fails here rather than being read
   * as a measurement.
   *
   * Passing `revision` additionally asks whether the run is still about the
   * current design. A run that read an older revision is reported as stale: it
   * was a real measurement of a building that no longer exists.
   *
   * Every violation is returned rather than thrown, with paths rooted at
   * `$input`: the contents first, then the digest, then staleness. The rules are
   * semantic: the run must already have the declared shape, because nested fields
   * such as `solver.id` are read without a guard, so a JSON value missing one
   * throws a `TypeError` instead of producing a violation.
   */
  export function validateAnalysisRun(props: IAutoMovieValidateAnalysisRun.IProps): IAutoMovieValidation {
    return validateAutoMovieAnalysisRunImplementation(props);
  }

  /**
   * Check every field of one analysis run except its seal.
   *
   * The rules all defend the same line: an absent measurement must stay visibly
   * absent. A metric without a value must carry a reason and a remedy and may not
   * carry a target; a metric with a value may not carry a gap and must agree with
   * its own verdict; a spatial sample may only be a field of a metric that
   * actually produced a value, so no overlay can be drawn for a computation
   * nobody ran.
   *
   * Violations are appended to `out` with paths rooted at `$input`, in field
   * order: header, solver, settings digest, then the outcome. The `digest` field
   * and its agreement with the contents are left to the caller:
   * `validateAutoMovieAnalysisRun` checks them for a run that arrived from
   * elsewhere, while `sealAutoMovieAnalysisRun` calls this before it computes the
   * digest, so a seal never hashes a record it will refuse.
   *
   * Resident metric, sample and warning slots are visited by index and an absent
   * record is refused at its slot; judged comparisons must be `at-least` or
   * `at-most`. Other nested fields must already have the declared shape: reading
   * a missing `solver.id` container or sample position can throw a `TypeError`,
   * so this is not a total unknown-JSON schema validator.
   *
   * @param run Run contents to check, with or without a digest.
   * @param out Caller-owned sink the violations are appended to.
   */
  export function validateAnalysisRunContents(run: Omit<IAutoMovieAnalysisRun, "digest">, out: IAutoMovieViolationCollector): void {
    validateAutoMovieAnalysisRunContentsImplementation(run, out);
  }

  /**
   * Check the half-spaces of one convex blocker.
   *
   * Shared by the context validator and by every adapter that accepts an authored
   * shading solid, so a neighbour's mass and the building's own canopy are held
   * to exactly the same standard.
   *
   * Violations are appended to `out` under `path` and worded with `label`;
   * resident plane slots are visited by index and missing records are refused at
   * their slot. The plane-array and other nested vector shapes remain a caller
   * premise; this helper does not validate arbitrary container types. The checks
   * are a plane count of at least `AutoMovieEngineAnalysisMinSolidPlanes`, finite
   * normals longer than `1e-12`, and finite offsets. Whether the planes enclose a
   * non-empty, bounded region is not checked, so four or more planes describing
   * an unbounded or empty set pass.
   *
   * @param planes Half-spaces whose intersection is the solid; a point is inside
   *   one when `dot(normal, point) <= offset`.
   * @param path Violation path of the plane array, such as
   *   `$input.occluders[0].planes`.
   * @param label Kind of solid named in every message, such as `occluder`.
   * @param out Caller-owned sink the violations are appended to.
   */
  export function validateSolidPlanes(planes: readonly IAutoMovieHalfSpacePlane[], path: string, label: string, out: IAutoMovieViolationCollector): void {
    validateSolidPlanesImplementation(planes, path, label, out);
  }

  /**
   * Report every declared target that names no metric the study reports.
   *
   * A target nobody can apply is the quietest way a report reads `meets`.
   * `autoMovieAnalysisMetric` already reports a target stated in the wrong unit
   * as a `target-unit-mismatch` warning for exactly this reason, and a mistyped
   * or hopeful key is the same fault with the same consequence: the author
   * believes a requirement is enforced, every metric is measured, no gap is
   * recorded, and the verdict comes back clean over a rule that was never
   * checked. So an inapplicable target is stated either way, here as a
   * `target-key-unknown` warning appended to `warnings` in declared order, one
   * per unmatched target.
   *
   * A target that names a metric which produced no value is **not** reported
   * here. That metric already carries its own reason and reaches the report as a
   * gap, so the requirement is visibly unanswered rather than silently dropped.
   *
   * `keys` is the whole set the study reports, which for a solver that emits more
   * than one run is the union across them: a moisture target is not unmatched
   * merely because the thermal run has no such metric.
   */
  export function warnAnalysisTargetKeys(props: IAutoMovieWarnAnalysisTargetKeys.IProps): void {
    warnAutoMovieAnalysisTargetKeysImplementation(props);
  }
  /** Prepare the isotropic sky term and measure it at world points. */
  export function skyIlluminance(props: IAutoMovieSkyIlluminance.IProps): (point: IAutoMovieVector3) => number {
    return autoMovieSkyIlluminanceImplementation(props);
  }

}
