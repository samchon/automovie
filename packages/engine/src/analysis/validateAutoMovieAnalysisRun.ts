import { IAutoMovieAnalysisMetric, IAutoMovieAnalysisRun, IAutoMovieAnalysisTarget, IAutoMovieValidation } from "@automovie/interface";
import { ViolationCollector } from "../validation/ViolationCollector";
import { AUTOMOVIE_ANALYSIS_MAX_SAMPLES } from "./AUTOMOVIE_ANALYSIS_MAX_SAMPLES";
import { autoMovieAnalysisRunDigest } from "./autoMovieAnalysisRunDigest";
import { isAutoMovieAnalysisDomain } from "./isAutoMovieAnalysisDomain";

/** A plain SHA-256 content digest as this project writes it. */
const DIGEST_PATTERN = /^sha256:[0-9a-f]{64}$/;

/** Whether a value satisfies a target in the declared direction. */
const satisfied = (
  value: number,
  target: number,
  comparison: IAutoMovieAnalysisTarget["comparison"],
): boolean => (comparison === "at-least" ? value >= target : value <= target);

/**
 * Validate one analysis run as evidence.
 *
 * The rules all defend the same line: an absent measurement must stay visibly
 * absent. A metric without a value must carry a reason and a remedy and may not
 * carry a target; a metric with a value may not carry a gap and must agree with
 * its own verdict; a spatial sample may only be a field of a metric that
 * actually produced a value, so no overlay can be drawn for a computation
 * nobody ran. The digest is recomputed, so a run whose outcome was edited after
 * sealing fails here rather than being read as a measurement.
 *
 * Passing `revision` additionally asks whether the run is still about the
 * current design. A run that read an older revision is reported as stale: it
 * was a real measurement of a building that no longer exists.
 *
 * @evidence requirements/diagnostics/collection-fail-fast-and-determinism.md#diagnostics-completeness-determinism `validateAutoMovieAnalysisRun` reports every structural, completeness, verdict, sample, digest, and staleness defect in stable order.
 * @evidence specifications/validation-and-diagnostics/collection-order-and-termination.md#validation-result-completeness-determinism The validator traverses the sealed run deterministically and distinguishes invalid evidence from a valid result for an obsolete revision.
 * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-derived-result-finding `validateAutoMovieAnalysisRun` diagnoses contradictions inside the sealed solver outcome after input acceptance, including invalid metrics, samples, verdicts, and digests.
 * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-derived-result-finding The validator locates defects in computed run evidence separately from authoring-input checks performed before sealing.
 * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-failed-not-run `validateAutoMovieAnalysisRun` requires failed and not-run outcomes to retain distinct statuses with non-empty reasons and remedies.
 * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-failed-not-run-states The sealed-run validator rejects an outcome that erases the difference between execution failure and deliberate non-execution.
 * @evidence requirements/evidence-and-provenance/completeness-freshness-and-refusal.md#evidence-unsupported-and-not-run `validateAutoMovieAnalysisRun` verifies that unsupported and not-run evidence stays explicit and carries an actionable explanation.
 * @evidence specifications/evidence-and-provenance/completeness-freshness-and-refusal.md#evp-outcome-classification-lattice The validator enforces the analysis run's solved, failed, unsupported, and not-run record shapes without treating absence as success.
 * @evidence requirements/evidence-and-provenance/scope-identity-and-status.md#evidence-portable-inspection `validateAutoMovieAnalysisRun` rechecks a deserialized run from its self-contained protocol, subject, revision, solver, settings digest, outcome, and content digest.
 * @evidence specifications/evidence-and-provenance/scope-identity-and-status.md#evp-portable-inspection-view The public validator supplies a portable inspection boundary for one complete analysis-run record without depending on hidden process state.
 */
export const validateAutoMovieAnalysisRun = (props: {
  /** Run to check. */
  run: IAutoMovieAnalysisRun;
  /** Current design revision, when staleness is being checked. */
  revision?: string;
}): IAutoMovieValidation => {
  const { run } = props;
  const out = new ViolationCollector();
  const root = "$input";

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
  nonEmpty(run.id, `${root}.id`, "analysis run id", out);
  nonEmpty(run.subject, `${root}.subject`, "analysis run subject", out);
  nonEmpty(
    run.inputRevision,
    `${root}.inputRevision`,
    "analysis run input revision",
    out,
  );
  if (!isAutoMovieAnalysisDomain(run.domain))
    out.push(
      "type",
      `${root}.domain`,
      `unknown analysis domain "${String(run.domain)}"`,
      run.domain,
    );
  nonEmpty(run.solver.id, `${root}.solver.id`, "solver id", out);
  nonEmpty(run.solver.version, `${root}.solver.version`, "solver version", out);
  nonEmpty(
    run.solver.model,
    `${root}.solver.model`,
    "solver governing model",
    out,
  );
  for (const key of ["settings", "digest"] as const)
    if (!DIGEST_PATTERN.test(run[key]))
      out.push(
        "type",
        `${root}.${key}`,
        `analysis run ${key} must be a lowercase "sha256:" hex digest, but was ${String(run[key])}`,
        run[key],
      );

  const outcome = run.outcome;
  if (outcome.status === "solved") {
    if (outcome.metrics.length === 0)
      out.push(
        "range",
        `${root}.outcome.metrics`,
        'a "solved" run must carry at least one metric; report an empty result as "not-run" or "unsupported"',
        outcome.metrics,
      );
    const measured = new Set<string>();
    const keys = new Set<string>();
    outcome.metrics.forEach((metric, index) => {
      const path = `${root}.outcome.metrics[${index}]`;
      nonEmpty(metric.key, `${path}.key`, "metric key", out);
      nonEmpty(metric.unit, `${path}.unit`, "metric unit", out);
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
    });

    if (outcome.samples.length > AUTOMOVIE_ANALYSIS_MAX_SAMPLES)
      out.push(
        "range",
        `${root}.outcome.samples`,
        `an analysis run carries at most ${AUTOMOVIE_ANALYSIS_MAX_SAMPLES} spatial samples, but had ${outcome.samples.length}`,
        outcome.samples.length,
      );
    const sampleIds = new Set<string>();
    outcome.samples.forEach((sample, index) => {
      const path = `${root}.outcome.samples[${index}]`;
      nonEmpty(sample.id, `${path}.id`, "sample id", out);
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
    });

    outcome.warnings.forEach((warning, index) => {
      const path = `${root}.outcome.warnings[${index}]`;
      nonEmpty(warning.code, `${path}.code`, "warning code", out);
      nonEmpty(warning.detail, `${path}.detail`, "warning detail", out);
      if (warning.subject !== null && warning.subject.trim() === "")
        out.push(
          "type",
          `${path}.subject`,
          "warning subject must be null or non-blank",
          warning.subject,
        );
    });
  } else if (outcome.status === "unsupported" || outcome.status === "not-run") {
    nonEmpty(
      outcome.reason,
      `${root}.outcome.reason`,
      `a "${outcome.status}" run reason`,
      out,
    );
    nonEmpty(
      outcome.remedy,
      `${root}.outcome.remedy`,
      `a "${outcome.status}" run remedy`,
      out,
    );
  } else
    out.push(
      "type",
      `${root}.outcome.status`,
      `unknown analysis outcome status "${String((outcome as { status: unknown }).status)}"`,
      (outcome as { status: unknown }).status,
    );

  const expected = autoMovieAnalysisRunDigest(run);
  if (run.digest !== expected)
    out.push(
      "type",
      `${root}.digest`,
      `analysis run digest ${run.digest} does not seal its own contents ${expected}`,
      run.digest,
    );
  if (props.revision !== undefined && run.inputRevision !== props.revision)
    out.push(
      "type",
      `${root}.inputRevision`,
      `analysis run read design revision "${run.inputRevision}" while the design is at "${props.revision}"; the result is stale`,
      run.inputRevision,
    );
  return out.toValidation();
};

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
      nonEmpty(
        metric.gap.reason,
        `${path}.gap.reason`,
        "metric gap reason",
        out,
      );
      nonEmpty(
        metric.gap.remedy,
        `${path}.gap.remedy`,
        "metric gap remedy",
        out,
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
  const verdict = satisfied(metric.value, metric.target, metric.comparison)
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

const nonEmpty = (
  value: string,
  path: string,
  label: string,
  out: ViolationCollector,
): void => {
  if (value.trim().length === 0)
    out.push("type", path, `${label} must be non-empty`, value);
};
