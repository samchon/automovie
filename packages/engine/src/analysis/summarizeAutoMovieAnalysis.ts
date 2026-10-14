import {
  AutoMovieAnalysisDomain,
  IAutoMovieAnalysisDomainRollup,
  IAutoMovieAnalysisGap,
  IAutoMovieAnalysisMetric,
  IAutoMovieAnalysisReport,
  IAutoMovieAnalysisRun,
  IAutoMovieConstraintViolation,
  IAutoMovieValidation,
} from "@automovie/interface";

import { autoMovieRenderDigest } from "../render/autoMovieRenderDigest";
import { withArticle } from "../text/withArticle";
import { AUTOMOVIE_ANALYSIS_DOMAINS } from "./constants/AUTOMOVIE_ANALYSIS_DOMAINS";
import { AUTOMOVIE_ANALYSIS_REPORT_MAX_GAPS } from "./constants/AUTOMOVIE_ANALYSIS_REPORT_MAX_GAPS";
import { isAutoMovieAnalysisDomain } from "./isAutoMovieAnalysisDomain";
import { validateAutoMovieAnalysisRun } from "./validateAutoMovieAnalysisRun";

/**
 * Roll every run of one design revision into one bounded verdict.
 *
 * The report cannot be cleared by silence. A required domain nobody submitted a
 * run for becomes a gap of its own; a run that read a superseded revision is
 * counted as stale rather than as an answer; a metric that produced no value
 * carries its reason up. Only when every required domain answered against this
 * revision, every metric produced a value, and every judged metric met its target does
 * the status read `meets`.
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
 * an empty or unknown required domain, a run that fails validation, and a run
 * id reported twice.
 *
 * @evidence contracts/common.md#principled-implementation Validates each run, folds counters by the fixed domain table, adds missing required domains and applies misses-before-incomplete-before-meets precedence. Untargeted measured metrics and warnings do not create a gap. JSON-array lines delimit covered fields, but omitted gap contents, signed-zero distinctions and SHA-256 collisions prevent treating equal digests as proof of identical source reports.
 * @evidence contracts/common.md#clear-and-simple-design One function owns the rollup, the bound and the digest because each depends on the same fold; run validation is delegated to `validateAutoMovieAnalysisRun` so a report accepts exactly the runs a reader would.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No domain, run id or status is special-cased; the default bound is the exported `AUTOMOVIE_ANALYSIS_REPORT_MAX_GAPS`, and a non-required domain's gaps still count toward `incomplete` because every submitted metric must produce a value.
 * @evidence contracts/common.md#meaningful-documentation The documentation states why silence cannot clear the report, the mandatory required domain, where gaps come from and their order, the status precedence, the bound, what the digest covers and its line form, and every throwing input; each property states its role and default.
 * @evidence contracts/performance.md#efficient-algorithms Linear in runs plus their metrics and samples, dominated by the validator rehashing every run, which is required because a deserialized run must be re-proven unedited; run-id uniqueness and required-domain membership are hashed lookups.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call folds the runs it is handed into one report; no validation verdict or digest is kept across calls because the runs may have been edited since.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Listed gaps are retained only up to the bound and later ones are counted, so gap memory is O(maxGaps) rather than O(total gaps); the id set grows with run count and the rollup map is fixed at six rows, all call-local except the returned report, which keeps the rows and the listed slice.
 * @author Samchon
 */
export const summarizeAutoMovieAnalysis: (props: {
  runs: readonly IAutoMovieAnalysisRun[];
  revision: string;
  required: readonly AutoMovieAnalysisDomain[];
  maxGaps?: number;
}) => IAutoMovieAnalysisReport = (props: {
  /** Runs to roll up; each is validated before it is counted. */
  runs: readonly IAutoMovieAnalysisRun[];

  /** Non-blank design revision the report is a verdict about. */
  revision: string;

  /** Domains the production requires an answer for; at least one, all known. */
  required: readonly AutoMovieAnalysisDomain[];

  /**
   * Positive safe-integer bound on listed gaps; defaults to
   * `AUTOMOVIE_ANALYSIS_REPORT_MAX_GAPS`.
   */
  maxGaps?: number;
}): IAutoMovieAnalysisReport => {
  if (props.revision.trim().length === 0)
    throw new Error(
      "an analysis report must state the design revision it is about",
    );
  const bound: number = props.maxGaps ?? AUTOMOVIE_ANALYSIS_REPORT_MAX_GAPS;
  if (!Number.isSafeInteger(bound) || bound < 1)
    throw new Error(
      `analysis report gap bound must be a positive safe integer, but was ${bound}`,
    );
  if (props.required.length === 0)
    throw new Error(
      "an analysis report must require at least one domain; a report over nothing cannot clear anything",
    );
  for (const domain of props.required)
    if (!isAutoMovieAnalysisDomain(domain))
      throw new Error(`unknown required analysis domain "${String(domain)}"`);
  const required: Set<AutoMovieAnalysisDomain> =
    new Set<AutoMovieAnalysisDomain>(props.required);

  const rollups: Map<AutoMovieAnalysisDomain, IAutoMovieAnalysisDomainRollup> =
    new Map<AutoMovieAnalysisDomain, IAutoMovieAnalysisDomainRollup>(
      AUTOMOVIE_ANALYSIS_DOMAINS.map(
        (
          domain: AutoMovieAnalysisDomain,
        ): [AutoMovieAnalysisDomain, IAutoMovieAnalysisDomainRollup] => [
          domain,
          {
            domain,
            runs: 0,
            solved: 0,
            unsupported: 0,
            notRun: 0,
            stale: 0,
            metrics: 0,
            measured: 0,
            meets: 0,
            misses: 0,
            required: required.has(domain),
          },
        ],
      ),
    );
  const listed: IAutoMovieAnalysisGap[] = [];
  let total: number = 0;
  const gap: (entry: IAutoMovieAnalysisGap) => void = (
    entry: IAutoMovieAnalysisGap,
  ): void => {
    ++total;
    if (listed.length < bound) listed.push(entry);
  };
  const seen: Set<string> = new Set<string>();
  for (const run of props.runs) {
    const validated: IAutoMovieValidation = validateAutoMovieAnalysisRun({
      run,
    });
    if (validated.success === false) {
      const first: IAutoMovieConstraintViolation = validated.violations[0]!;
      throw new Error(
        `analysis run "${run.id}" cannot be reported at ${first.path}: ${first.expected}`,
      );
    }
    if (seen.has(run.id))
      throw new Error(`analysis run id "${run.id}" is reported more than once`);
    seen.add(run.id);
    const rollup: IAutoMovieAnalysisDomainRollup = rollups.get(run.domain)!;
    ++rollup.runs;
    if (run.inputRevision !== props.revision) {
      ++rollup.stale;
      gap({
        run: run.id,
        domain: run.domain,
        metric: null,
        status: "not-run",
        reason: `run "${run.id}" read design revision "${run.inputRevision}" while the design is at "${props.revision}"`,
        remedy: `re-run the ${run.domain} analysis against revision "${props.revision}"`,
      });
      continue;
    }
    if (run.outcome.status !== "solved") {
      if (run.outcome.status === "unsupported") ++rollup.unsupported;
      else ++rollup.notRun;
      gap({
        run: run.id,
        domain: run.domain,
        metric: null,
        status: run.outcome.status,
        reason: run.outcome.reason,
        remedy: run.outcome.remedy,
      });
      continue;
    }
    ++rollup.solved;
    run.outcome.metrics.forEach((metric: IAutoMovieAnalysisMetric): void => {
      ++rollup.metrics;
      if (metric.value === null) {
        gap({
          run: run.id,
          domain: run.domain,
          metric: metric.key,
          status: metric.status === "unsupported" ? "unsupported" : "not-run",
          reason: metric.gap!.reason,
          remedy: metric.gap!.remedy,
        });
        return;
      }
      ++rollup.measured;
      if (metric.status === "meets") ++rollup.meets;
      else if (metric.status === "misses") ++rollup.misses;
    });
  }

  for (const domain of AUTOMOVIE_ANALYSIS_DOMAINS) {
    const rollup: IAutoMovieAnalysisDomainRollup = rollups.get(domain)!;
    if (rollup.required && rollup.runs === 0)
      gap({
        run: null,
        domain,
        metric: null,
        status: "not-run",
        reason: `the production requires ${withArticle(domain)} answer and no run was submitted`,
        remedy: `run ${withArticle(domain)} analysis against revision "${props.revision}", or stop requiring the domain`,
      });
  }

  const domains: IAutoMovieAnalysisDomainRollup[] =
    AUTOMOVIE_ANALYSIS_DOMAINS.map(
      (domain: AutoMovieAnalysisDomain): IAutoMovieAnalysisDomainRollup =>
        rollups.get(domain)!,
    );
  const status: IAutoMovieAnalysisReport["status"] = domains.some(
    (rollup: IAutoMovieAnalysisDomainRollup): boolean => rollup.misses > 0,
  )
    ? "misses"
    : total > 0
      ? "incomplete"
      : "meets";
  const report: Omit<IAutoMovieAnalysisReport, "digest"> = {
    version: 1,
    protocol: "automovie.analysis-report.v1",
    status,
    revision: props.revision,
    domains,
    gaps: listed,
    omittedGaps: total - listed.length,
  };
  return {
    ...report,
    digest: autoMovieRenderDigest(
      [
        JSON.stringify([
          report.protocol,
          report.version,
          report.status,
          report.revision,
        ]),
        ...domains.map((rollup: IAutoMovieAnalysisDomainRollup): string =>
          JSON.stringify([
            rollup.domain,
            rollup.runs,
            rollup.solved,
            rollup.unsupported,
            rollup.notRun,
            rollup.stale,
            rollup.metrics,
            rollup.measured,
            rollup.meets,
            rollup.misses,
            rollup.required,
          ]),
        ),
        ...listed.map((entry: IAutoMovieAnalysisGap): string =>
          JSON.stringify([
            entry.run,
            entry.domain,
            entry.metric,
            entry.status,
            entry.reason,
            entry.remedy,
          ]),
        ),
        JSON.stringify(report.omittedGaps),
      ].join("\n"),
    ),
  };
};
