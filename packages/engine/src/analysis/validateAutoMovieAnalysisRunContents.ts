import {
  IAutoMovieAnalysisMetric,
  IAutoMovieAnalysisOutcome,
  IAutoMovieAnalysisRun,
  IAutoMovieAnalysisSample,
  IAutoMovieAnalysisWarning,
} from "@automovie/interface";

import { ViolationCollector } from "../validation/ViolationCollector";
import { SHA256_DIGEST_PATTERN } from "../validation/constants/SHA256_DIGEST_PATTERN";
import { autoMovieAnalysisTargetMet } from "./autoMovieAnalysisTargetMet";
import { AUTOMOVIE_ANALYSIS_MAX_SAMPLES } from "./constants/AUTOMOVIE_ANALYSIS_MAX_SAMPLES";
import { isAutoMovieAnalysisDomain } from "./isAutoMovieAnalysisDomain";

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
 * The run must already have the declared shape: nested fields such as
 * `solver.id` are read without a guard, so a JSON value missing one throws a
 * `TypeError` instead of producing a violation.
 *
 * @param run Run contents to check, with or without a digest.
 * @param out Caller-owned sink the violations are appended to.
 *
 * @evidence contracts/common.md#principled-implementation Accumulates violations in a `ViolationCollector`, checks metric-key and sample-id uniqueness with `Set`s, admits a sample only for a key that produced a value, and re-derives each judged metric's verdict with `autoMovieAnalysisTargetMet`; it relies on a structurally typed input, which is the stated limitation for raw JSON.
 * @evidence contracts/common.md#clear-and-simple-design The contents rules live once here because two owners need them without the seal: the public validator adds the digest check, and the seal checks before hashing; per-metric rules sit in one private helper because they branch on the value's presence.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Fixed values are contract constants (version 1, the `automovie.analysis-run.v1` protocol, the `sha256:` pattern, `AUTOMOVIE_ANALYSIS_MAX_SAMPLES`); an unknown outcome status is reported rather than skipped, and the cast in that branch only reads a status the union says cannot occur.
 * @evidence contracts/common.md#meaningful-documentation The documentation states the absent-measurement rules, the violation order and root, which caller checks the excluded seal and why, and the shape premise with its `TypeError` consequence.
 * @evidence contracts/performance.md#efficient-algorithms One pass over the M metrics, S samples (bounded by `AUTOMOVIE_ANALYSIS_MAX_SAMPLES` only through the violation it raises) and W warnings with hashed uniqueness and measured-key lookups, so time is O(M + S + W) and memory is three key sets.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call checks the one run it is handed; the seal and the public validator call it on different occasions, and no verdict is cached because a deserialized run must be re-proven.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The key sets are call-local and released on return; violations appended to the caller's collector may reference fragments of the run, and the caller owns the collector.
 * @author Samchon
 */
export const validateAutoMovieAnalysisRunContents = (
  run: Omit<IAutoMovieAnalysisRun, "digest">,
  out: ViolationCollector,
): void => {
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
  out.nonEmpty(`${root}.id`, run.id, "analysis run id");
  out.nonEmpty(`${root}.subject`, run.subject, "analysis run subject");
  out.nonEmpty(
    `${root}.inputRevision`,
    run.inputRevision,
    "analysis run input revision",
  );
  if (!isAutoMovieAnalysisDomain(run.domain))
    out.push(
      "type",
      `${root}.domain`,
      `unknown analysis domain "${String(run.domain)}"`,
      run.domain,
    );
  out.nonEmpty(`${root}.solver.id`, run.solver.id, "solver id");
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
    outcome.metrics.forEach(
      (metric: IAutoMovieAnalysisMetric, index: number): void => {
        const path: string = `${root}.outcome.metrics[${index}]`;
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
      },
    );

    if (outcome.samples.length > AUTOMOVIE_ANALYSIS_MAX_SAMPLES)
      out.push(
        "range",
        `${root}.outcome.samples`,
        `an analysis run carries at most ${AUTOMOVIE_ANALYSIS_MAX_SAMPLES} spatial samples, but had ${outcome.samples.length}`,
        outcome.samples.length,
      );
    const sampleIds: Set<string> = new Set<string>();
    outcome.samples.forEach(
      (sample: IAutoMovieAnalysisSample, index: number): void => {
        const path: string = `${root}.outcome.samples[${index}]`;
        out.nonEmpty(`${path}.id`, sample.id, "sample id");
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
        for (const axis of ["x", "y", "z"] as const)
          if (!Number.isFinite(sample.position[axis]))
            out.push(
              "range",
              `${path}.position.${axis}`,
              `sample position ${axis} must be finite, but was ${sample.position[axis]}`,
              sample.position[axis],
            );
        if (!Number.isFinite(sample.value))
          out.push(
            "range",
            `${path}.value`,
            `sample value must be finite, but was ${sample.value}`,
            sample.value,
          );
      },
    );

    outcome.warnings.forEach(
      (warning: IAutoMovieAnalysisWarning, index: number): void => {
        const path: string = `${root}.outcome.warnings[${index}]`;
        out.nonEmpty(`${path}.code`, warning.code, "warning code");
        out.nonEmpty(`${path}.detail`, warning.detail, "warning detail");
        if (warning.subject !== null && warning.subject.trim() === "")
          out.push(
            "type",
            `${path}.subject`,
            "warning subject must be null or non-blank",
            warning.subject,
          );
      },
    );
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
};

/** Check one metric's value, gap, target and verdict against each other. */
const validateMetric = (
  metric: IAutoMovieAnalysisMetric,
  path: string,
  out: ViolationCollector,
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
      out.nonEmpty(`${path}.gap.reason`, metric.gap.reason, "metric gap reason");
      out.nonEmpty(`${path}.gap.remedy`, metric.gap.remedy, "metric gap remedy");
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
  if (!Number.isFinite(metric.value))
    out.push(
      "range",
      `${path}.value`,
      `metric "${metric.key}" must be a finite value, but was ${metric.value}`,
      metric.value,
    );
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
  if (!Number.isFinite(metric.target)) {
    out.push(
      "range",
      `${path}.target`,
      `metric "${metric.key}" target must be finite, but was ${metric.target}`,
      metric.target,
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
