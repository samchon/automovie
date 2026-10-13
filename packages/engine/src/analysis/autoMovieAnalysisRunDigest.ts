import { IAutoMovieAnalysisRun } from "@automovie/interface";

import { autoMovieRenderDigest } from "../render/autoMovieRenderDigest";

/**
 * The digest that seals one run's contents.
 *
 * Exported because a run that arrived as JSON has to be checkable by the same
 * rule that produced it, and because a second implementation of the canonical
 * form would be a second answer to what a run says.
 *
 * The digest is a `sha256:` hex string over a newline-joined text. That text is
 * not injective: header fields are joined with newlines and solver fields with
 * `|`, neither escaped, so moving a newline or `|` across a field boundary in
 * `id`, `subject`, `inputRevision` or the solver strings yields the same
 * digest, and run validation does not forbid either character.
 *
 * @author Samchon
 */
export const autoMovieAnalysisRunDigest = (
  run: Omit<IAutoMovieAnalysisRun, "digest">,
): IAutoMovieAnalysisRun["digest"] => autoMovieRenderDigest(runDigestText(run));

/**
 * The canonical text one run's digest is taken over.
 *
 * Every field that changes what the run claims appears exactly once, in a fixed
 * order, so the same run digests identically on every host. Metric, sample and
 * warning lines are JSON arrays and cannot run into each other, but the header
 * lines and the `|`-joined solver line are raw strings, so a field containing a
 * newline or `|` can make two different runs produce the same text.
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
