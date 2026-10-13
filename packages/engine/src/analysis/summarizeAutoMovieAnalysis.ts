import {
  AutoMovieAnalysisDomain,
  IAutoMovieAnalysisDomainRollup,
  IAutoMovieAnalysisGap,
  IAutoMovieAnalysisReport,
  IAutoMovieAnalysisRun,
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
 * revision, every metric produced a value, and every declared target held does
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
 * list are listed and the rest only counted. The digest covers the listed gaps
 * and that count, not the text of the omitted ones.
 *
 * Throws on a blank revision, a gap bound that is not a positive safe integer,
 * an empty or unknown required domain, a run that fails validation, and a run
 * id reported twice.
 */
export const summarizeAutoMovieAnalysis = (props: {
  /** Runs to roll up; each is validated before it is counted. */
  runs: readonly IAutoMovieAnalysisRun[];

  /** Design revision the report is a verdict about. */
  revision: string;

  /** Domains the production requires an answer for; at least one. */
  required: readonly AutoMovieAnalysisDomain[];

  /** Listed-gap bound; defaults to the exported maximum. */
  maxGaps?: number;
}): IAutoMovieAnalysisReport => {
  if (props.revision.trim().length === 0)
    throw new Error(
      "an analysis report must state the design revision it is about",
    );
  const bound = props.maxGaps ?? AUTOMOVIE_ANALYSIS_REPORT_MAX_GAPS;
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
  const required = new Set(props.required);

  const rollups = new Map<
    AutoMovieAnalysisDomain,
    IAutoMovieAnalysisDomainRollup
  >(
    AUTOMOVIE_ANALYSIS_DOMAINS.map((domain) => [
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
    ]),
  );
  const gaps: IAutoMovieAnalysisGap[] = [];
  const seen = new Set<string>();
  for (const run of props.runs) {
    const validated = validateAutoMovieAnalysisRun({ run });
    if (validated.success === false) {
      const first = validated.violations[0]!;
      throw new Error(
        `analysis run "${run.id}" cannot be reported at ${first.path}: ${first.expected}`,
      );
    }
    if (seen.has(run.id))
      throw new Error(`analysis run id "${run.id}" is reported more than once`);
    seen.add(run.id);
    const rollup = rollups.get(run.domain)!;
    ++rollup.runs;
    if (run.inputRevision !== props.revision) {
      ++rollup.stale;
      gaps.push({
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
      gaps.push({
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
    for (const metric of run.outcome.metrics) {
      ++rollup.metrics;
      if (metric.value === null) {
        gaps.push({
          run: run.id,
          domain: run.domain,
          metric: metric.key,
          status: metric.status === "unsupported" ? "unsupported" : "not-run",
          reason: metric.gap!.reason,
          remedy: metric.gap!.remedy,
        });
        continue;
      }
      ++rollup.measured;
      if (metric.status === "meets") ++rollup.meets;
      else if (metric.status === "misses") ++rollup.misses;
    }
  }

  for (const domain of AUTOMOVIE_ANALYSIS_DOMAINS) {
    const rollup = rollups.get(domain)!;
    if (rollup.required && rollup.runs === 0)
      gaps.push({
        run: null,
        domain,
        metric: null,
        status: "not-run",
        reason: `the production requires ${withArticle(domain)} answer and no run was submitted`,
        remedy: `run ${withArticle(domain)} analysis against revision "${props.revision}", or stop requiring the domain`,
      });
  }

  const domains = AUTOMOVIE_ANALYSIS_DOMAINS.map(
    (domain) => rollups.get(domain)!,
  );
  const status: IAutoMovieAnalysisReport["status"] = domains.some(
    (rollup) => rollup.misses > 0,
  )
    ? "misses"
    : gaps.length > 0
      ? "incomplete"
      : "meets";
  const listed = gaps.slice(0, bound);
  const report = {
    version: 1,
    protocol: "automovie.analysis-report.v1",
    status,
    revision: props.revision,
    domains,
    gaps: listed,
    omittedGaps: gaps.length - listed.length,
  } as const;
  return {
    ...report,
    digest: autoMovieRenderDigest(
      [
        report.protocol,
        String(report.version),
        report.status,
        report.revision,
        ...domains.map((rollup) =>
          [
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
          ].join("|"),
        ),
        ...listed.map((gap) =>
          [
            String(gap.run),
            gap.domain,
            String(gap.metric),
            gap.status,
            gap.reason,
            gap.remedy,
          ].join("|"),
        ),
        String(report.omittedGaps),
      ].join("\n"),
    ),
  };
};
