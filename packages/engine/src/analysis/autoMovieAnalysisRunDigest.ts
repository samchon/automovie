import { IAutoMovieAnalysisRun } from "@automovie/interface";

import { autoMovieRenderDigest } from "../render/autoMovieRenderDigest";

/**
 *
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
 * @evidence contracts/common.md#principled-implementation SHA-256 over a fixed-order text of every field that changes what the run claims, with each metric, sample and warning JSON-encoded on its own line, so one run digests identically on every host.
 * @evidence contracts/common.md#clear-and-simple-design Exported so `sealAutoMovieAnalysisRun` and `validateAutoMovieAnalysisRun` share one canonical form; the private text builder is the only other piece.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unescaped newline and `|` separators make the canonical text ambiguous for free-text header and solver fields, a canonicalization defect stated here rather than fixed.
 * @evidence contracts/common.md#meaningful-documentation States why it is exported, which fields enter the text, the digest form, and the separator ambiguity.
 * @evidence contracts/performance.md#cost-and-resources Linear in metrics, samples (at most 4096) and warnings to build the text, then one pure-TypeScript SHA-256 pass over its UTF-8 bytes, which are materialized as a number array. Not memoized: `sealAutoMovieAnalysisRun` computes the digest and then its own validation recomputes it over the same draft, so every seal hashes the run text twice. The line array, text and byte array live only for the call, and the digest string is the only output.
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
