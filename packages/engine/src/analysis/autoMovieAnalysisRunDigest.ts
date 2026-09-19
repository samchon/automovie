import { IAutoMovieAnalysisRun } from "@automovie/interface";
import { autoMovieRenderDigest } from "../render/autoMovieRenderDigest";

/**
 * The digest that seals one run's contents.
 *
 * Exported because a run that arrived as JSON has to be checkable by the same
 * rule that produced it, and because a second implementation of the canonical
 * form would be a second answer to what a run says.
 *
 * @evidence requirements/diagnostics/collection-fail-fast-and-determinism.md#diagnostics-completeness-determinism `autoMovieAnalysisRunDigest` gives the complete run record one repeatable integrity identity that changes with its evidence.
 * @evidence specifications/validation-and-diagnostics/collection-order-and-termination.md#validation-result-completeness-determinism The function serializes the canonical run payload and applies the shared SHA-256 content digest used during sealing and validation.
 */
export const autoMovieAnalysisRunDigest = (
  run: Omit<IAutoMovieAnalysisRun, "digest">,
): IAutoMovieAnalysisRun["digest"] => autoMovieRenderDigest(runDigestText(run));

/**
 * The canonical text one run's digest is taken over.
 *
 * Every field that changes what the run claims appears exactly once, joined by
 * separators the fields themselves cannot contain positionally, so two runs
 * differing anywhere digest differently and the same run digests identically on
 * every host.
 */
const runDigestText = (run: Omit<IAutoMovieAnalysisRun, "digest">): string => {
  const lines = [
    run.protocol,
    String(run.version),
    run.id,
    run.domain,
    run.subject,
    run.inputRevision,
    [run.solver.id, run.solver.version, run.solver.model].join("|"),
    run.settings,
    run.outcome.status,
  ];
  if (run.outcome.status === "solved") {
    for (const metric of run.outcome.metrics)
      lines.push(
        JSON.stringify([
          metric.key,
          metric.unit,
          metric.value,
          metric.target,
          metric.comparison,
          metric.status,
          metric.gap?.reason ?? null,
          metric.gap?.remedy ?? null,
        ]),
      );
    for (const sample of run.outcome.samples)
      lines.push(
        JSON.stringify([
          sample.id,
          sample.key,
          sample.position.x,
          sample.position.y,
          sample.position.z,
          sample.value,
        ]),
      );
    for (const warning of run.outcome.warnings)
      lines.push(
        JSON.stringify([warning.code, warning.subject, warning.detail]),
      );
  } else lines.push(JSON.stringify([run.outcome.reason, run.outcome.remedy]));
  return lines.join("\n");
};
