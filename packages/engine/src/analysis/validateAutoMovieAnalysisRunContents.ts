import {
  IAutoMovieAnalysisMetric,
  IAutoMovieAnalysisOutcome,
  IAutoMovieAnalysisRun,
  IAutoMovieAnalysisSample,
  IAutoMovieAnalysisWarning,
  type IAutoMovieViolationCollector,
} from "@automovie/interface";

import { SHA256_DIGEST_PATTERN } from "../validation/constants/SHA256_DIGEST_PATTERN";
import { autoMovieAnalysisTargetMet } from "./autoMovieAnalysisTargetMet";
import { AUTOMOVIE_ANALYSIS_MAX_SAMPLES } from "./constants/AUTOMOVIE_ANALYSIS_MAX_SAMPLES";

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
export function validateAutoMovieAnalysisRunContents(
  run: Omit<IAutoMovieAnalysisRun, "digest">,
  out: IAutoMovieViolationCollector,
): void {
  const root: string = "$input";
  if (run.version !== 1)
    out.push(
      "type",
      `${root}.version`,
      `analysis run schema version must be 1, but was ${run.version}`,
      run.version,
    );
  if (run.protocol !== "automovie.analysis-run.v1")
    out.push(
      "type",
      `${root}.protocol`,
      `analysis run protocol must be "automovie.analysis-run.v1", but was ${String(run.protocol)}`,
      run.protocol,
    );
  out.nonEmpty(`${root}.subject`, run.subject, "analysis run subject");
  out.nonEmpty(
    `${root}.inputRevision`,
    run.inputRevision,
    "analysis run input revision",
  );

  out.nonEmpty(`${root}.solver.version`, run.solver.version, "solver version");
  out.nonEmpty(
    `${root}.solver.model`,
    run.solver.model,
    "solver governing model",
  );
  if (!SHA256_DIGEST_PATTERN.test(run.settings))
    out.push(
      "type",
      `${root}.settings`,
      `analysis run settings must be a lowercase "sha256:" hex digest, but was ${String(run.settings)}`,
      run.settings,
    );

  const outcome: IAutoMovieAnalysisOutcome = run.outcome;
  if (outcome.status === "solved") {
    if (outcome.metrics.length === 0)
      out.push(
        "range",
        `${root}.outcome.metrics`,
        'a "solved" run must carry at least one metric; report an empty result as "not-run" or "unsupported"',
        outcome.metrics,
      );
    const measured: Set<string> = new Set<string>();
    const keys: Set<string> = new Set<string>();
    for (let index: number = 0; index < outcome.metrics.length; ++index) {
      const metric: IAutoMovieAnalysisMetric | undefined =
        outcome.metrics[index];
      const path: string = `${root}.outcome.metrics[${index}]`;
      if (metric === undefined) {
        out.push(
          "type",
          path,
          "a resident metric slot must contain its declared record",
          metric,
        );
        continue;
      }
      out.nonEmpty(`${path}.key`, metric.key, "metric key");
      out.nonEmpty(`${path}.unit`, metric.unit, "metric unit");
      if (keys.has(metric.key))
        out.push(
          "type",
          `${path}.key`,
          `metric key "${metric.key}" must be unique within a run`,
          metric.key,
        );
      keys.add(metric.key);
      validateMetric(metric, path, out);
      if (metric.value !== null) measured.add(metric.key);
    }

    if (outcome.samples.length > AUTOMOVIE_ANALYSIS_MAX_SAMPLES)
      out.push(
        "range",
        `${root}.outcome.samples`,
        `an analysis run carries at most ${AUTOMOVIE_ANALYSIS_MAX_SAMPLES} spatial samples, but had ${outcome.samples.length}`,
        outcome.samples.length,
      );
    const sampleIds: Set<string> = new Set<string>();
    for (let index: number = 0; index < outcome.samples.length; ++index) {
      const sample: IAutoMovieAnalysisSample | undefined =
        outcome.samples[index];
      const path: string = `${root}.outcome.samples[${index}]`;
      if (sample === undefined) {
        out.push(
          "type",
          path,
          "a resident sample slot must contain its declared record",
          sample,
        );
        continue;
      }
      if (sampleIds.has(sample.id))
        out.push(
          "type",
          `${path}.id`,
          `sample id "${sample.id}" must be unique within a run`,
          sample.id,
        );
      sampleIds.add(sample.id);
      if (!measured.has(sample.key))
        out.push(
          "type",
          `${path}.key`,
          `sample field "${sample.key}" names no metric of this run that produced a value; a field cannot be drawn for a measurement nobody made`,
          sample.key,
        );
    }

    for (let index: number = 0; index < outcome.warnings.length; ++index) {
      const warning: IAutoMovieAnalysisWarning | undefined =
        outcome.warnings[index];
      const path: string = `${root}.outcome.warnings[${index}]`;
      if (warning === undefined) {
        out.push(
          "type",
          path,
          "a resident warning slot must contain its declared record",
          warning,
        );
        continue;
      }
      out.nonEmpty(`${path}.code`, warning.code, "warning code");
      out.nonEmpty(`${path}.detail`, warning.detail, "warning detail");
      if (warning.subject !== null && warning.subject.trim() === "")
        out.push(
          "type",
          `${path}.subject`,
          "warning subject must be null or non-blank",
          warning.subject,
        );
    }
  } else if (outcome.status === "unsupported" || outcome.status === "not-run") {
    out.nonEmpty(
      `${root}.outcome.reason`,
      outcome.reason,
      `a "${outcome.status}" run reason`,
    );
    out.nonEmpty(
      `${root}.outcome.remedy`,
      outcome.remedy,
      `a "${outcome.status}" run remedy`,
    );
  } else {
    const status: unknown = (outcome as { status: unknown }).status;
    out.push(
      "type",
      `${root}.outcome.status`,
      `unknown analysis outcome status "${String(status)}"`,
      status,
    );
  }
}

/**
 * Check one metric's value, gap, target and verdict against each other under
 * the typed nested-record premise.
 *
 * A null value requires an unsupported/not-run status and a nonblank
 * reason/remedy; a present value requires finite measurement, no gap and either
 * no target or a finite target with one of the two inclusive directions. Judged
 * status is derived again from that direction, with no key exception, numerical
 * tolerance or unit conversion.
 *
 * The received-run validator and seal reach this private helper through the
 * same contents walk and collector. Errors use the supplied metric path, while
 * arbitrary nested containers remain outside this semantic check.
 *
 * Scalar work is constant per metric and nonblank string checks depend on
 * character counts; no other metric is searched. Each contents pass revalidates
 * the mutable record with no retained verdict. Appended violations may
 * reference metric fragments and remain owned by the caller's collector.
 */
const validateMetric: (
  metric: IAutoMovieAnalysisMetric,
  path: string,
  out: IAutoMovieViolationCollector,
) => void = (
  metric: IAutoMovieAnalysisMetric,
  path: string,
  out: IAutoMovieViolationCollector,
): void => {
  if (metric.value === null) {
    if (metric.status !== "unsupported" && metric.status !== "not-run")
      out.push(
        "type",
        `${path}.status`,
        `metric "${metric.key}" produced no value, so its status must be "unsupported" or "not-run", but was ${String(metric.status)}`,
        metric.status,
      );
    if (metric.gap === null)
      out.push(
        "type",
        `${path}.gap`,
        `metric "${metric.key}" produced no value and must state the reason and the remedy`,
        metric.gap,
      );
    else {
      out.nonEmpty(
        `${path}.gap.reason`,
        metric.gap.reason,
        "metric gap reason",
      );
      out.nonEmpty(
        `${path}.gap.remedy`,
        metric.gap.remedy,
        "metric gap remedy",
      );
    }
    if (metric.target !== null)
      out.push(
        "type",
        `${path}.target`,
        `metric "${metric.key}" produced no value, so it cannot be compared to a target`,
        metric.target,
      );
    if (metric.comparison !== null)
      out.push(
        "type",
        `${path}.comparison`,
        `metric "${metric.key}" produced no value, so it carries no comparison`,
        metric.comparison,
      );
    return;
  }
  if (metric.gap !== null)
    out.push(
      "type",
      `${path}.gap`,
      `metric "${metric.key}" carries a value, so it cannot also carry a gap`,
      metric.gap,
    );
  if (metric.status === "untargeted") {
    if (metric.target !== null || metric.comparison !== null)
      out.push(
        "type",
        `${path}.target`,
        `metric "${metric.key}" is untargeted, so it must carry neither a target nor a comparison`,
        metric.target,
      );
    return;
  }
  if (metric.status !== "meets" && metric.status !== "misses") {
    out.push(
      "type",
      `${path}.status`,
      `metric "${metric.key}" carries a value, so its status must be "meets", "misses" or "untargeted", but was ${String(metric.status)}`,
      metric.status,
    );
    return;
  }
  if (metric.target === null || metric.comparison === null) {
    out.push(
      "type",
      `${path}.target`,
      `metric "${metric.key}" reports "${metric.status}", so it must carry the target and the direction it was judged against`,
      metric.target,
    );
    return;
  }

  if (metric.comparison !== "at-least" && metric.comparison !== "at-most") {
    out.push(
      "type",
      `${path}.comparison`,
      `metric "${metric.key}" comparison must be "at-least" or "at-most", but was ${String(metric.comparison)}`,
      metric.comparison,
    );
    return;
  }
  const verdict: "meets" | "misses" = autoMovieAnalysisTargetMet(
    metric.value,
    metric.target,
    metric.comparison,
  )
    ? "meets"
    : "misses";
  if (verdict !== metric.status)
    out.push(
      "type",
      `${path}.status`,
      `metric "${metric.key}" reports "${metric.status}" while ${metric.value} ${metric.comparison} ${metric.target} ${verdict === "meets" ? "holds" : "fails"}`,
      metric.status,
    );
};
