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

import { type IAutoMovieAnalysisRun, type IAutoMovieAnalyzeAcoustics, type IAutoMovieAnalyzeDaylight, type IAutoMovieAnalyzeEnvelope, type IAutoMovieAnalyzeSpaceAir, type IAutoMovieAnalysisSolid, type IAutoMovieAnalysisTarget, type AutoMovieAnalysisComparison, type IAutoMovieResolveDaylightRequest, type IAutoMovieDaylightRequest, type IAutoMovieEnvironmentInstant, type IAutoMovieEnvelopeRequest, type IAutoMovieSealAnalysisRun, type IAutoMovieAnalysisReport, type IAutoMovieSummarizeAnalysis, type IAutoMovieValidation, type IAutoMovieValidateAnalysisRun, type IAutoMovieViolationCollector, type IAutoMovieHalfSpacePlane, type IAutoMovieWarnAnalysisTargetKeys } from "@automovie/interface";

import { analyzeAutoMovieAcoustics } from "./internal/analyzeAutoMovieAcoustics";
import { analyzeAutoMovieDaylight } from "./internal/analyzeAutoMovieDaylight";
import { analyzeAutoMovieEnvelope } from "./internal/analyzeAutoMovieEnvelope";
import { analyzeAutoMovieSpaceAir } from "./internal/analyzeAutoMovieSpaceAir";

/** Deterministic analyses for declared acoustic, daylight, envelope and air studies. */
export namespace AutoMovieEngineAnalysis {
  /** Solve one acoustic request and return its sealed analysis run. */
  export function acoustics(
    props: IAutoMovieAnalyzeAcoustics.IProps,
  ): IAutoMovieAnalysisRun {
    return analyzeAutoMovieAcoustics(props);
  }

  /** Measure one daylight workplane and return its sealed analysis run. */
  export function daylight(
    props: IAutoMovieAnalyzeDaylight.IProps,
  ): IAutoMovieAnalysisRun {
    return analyzeAutoMovieDaylight(props);
  }

  /** Solve one envelope request as paired thermal and moisture runs. */
  export function envelope(
    props: IAutoMovieAnalyzeEnvelope.IProps,
  ): IAutoMovieAnalyzeEnvelope.IResult {
    return analyzeAutoMovieEnvelope(props);
  }

  /** Solve one well-mixed space-air request and return its sealed run. */
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
   * are a plane count of at least `AUTOMOVIE_ANALYSIS_MIN_SOLID_PLANES`, finite
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
}
