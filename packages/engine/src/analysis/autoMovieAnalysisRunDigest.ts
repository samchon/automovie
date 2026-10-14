import {
  IAutoMovieAnalysisMetric,
  IAutoMovieAnalysisRun,
  IAutoMovieAnalysisSample,
  IAutoMovieAnalysisWarning,
} from "@automovie/interface";

import { autoMovieRenderDigest } from "../render/autoMovieRenderDigest";

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
 * encoded JSON value produce different text. JSON normalizes signed zero and writes nonfinite numbers as null; hash collisions are possible. Reordering distinct metrics, samples or warnings changes the
 * digest.
 *
 * @param run Run contents; a `digest` field, if present, is not read.
 * @returns The `sha256:` digest of the canonical text.
 *
 * @evidence contracts/common.md#principled-implementation SHA-256 hashes fixed-order JSON-array lines whose syntax delimits fields and escapes strings. Validated finite JSON values produce deterministic text; signed zeros share an encoding, nonfinite numbers become null outside the admitted domain and equal hashes do not prove identity. Typed records with ordinary data fields are the caller premise.
 * @evidence contracts/common.md#clear-and-simple-design One exported function owns the canonical form for the seal, the validator and test fixtures alike, with the text builder kept private because no caller needs the text itself.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every covered field is encoded the same way, with no run, domain or solver special-cased; the only fixed choice is the field order, which is the canonical form itself.
 * @evidence contracts/common.md#meaningful-documentation Lists covered header fields and line order, signed-zero/nonfinite encoding limits, collision limits, entry-order sensitivity and ignored digest input.
 * @evidence contracts/performance.md#efficient-algorithms Linear in metrics M, samples S (at most 4096 in a valid run) and warnings W to build the text, then one pure-TypeScript SHA-256 pass over its UTF-8 bytes, which dominates; no part of the run is traversed twice.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure function of one run; reuse belongs to callers, and the seal now calls it once per run while a received run must be rehashed to be proven.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The line array, the joined text and the byte array exist only for the call, growing with M + S + W, and only the digest string is returned.
 * @author Samchon
 */
export const autoMovieAnalysisRunDigest: (run: Omit<IAutoMovieAnalysisRun, "digest">) => IAutoMovieAnalysisRun["digest"] = (
  run: Omit<IAutoMovieAnalysisRun, "digest">,
): IAutoMovieAnalysisRun["digest"] => autoMovieRenderDigest(runDigestText(run));

/** Encode the covered run fields as fixed-order JSON-array lines, borrowing typed data without admission. Solved outcomes emit metric/sample/warning rows; other outcomes emit reason/remedy. Work and temporary line/text storage scale with encoded characters and entries; no encoding or verdict is cached, and only the text escapes to the digest caller. */
const runDigestText: (run: Omit<IAutoMovieAnalysisRun, "digest">) => string = (run: Omit<IAutoMovieAnalysisRun, "digest">): string => {
  const lines: string[] = [
    JSON.stringify([
      run.protocol,
      run.version,
      run.id,
      run.domain,
      run.subject,
      run.inputRevision,
      run.solver.id,
      run.solver.version,
      run.solver.model,
      run.settings,
      run.outcome.status,
    ]),
  ];
  if (run.outcome.status === "solved") {
    run.outcome.metrics.forEach((metric: IAutoMovieAnalysisMetric): void => {
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
    });
    run.outcome.samples.forEach((sample: IAutoMovieAnalysisSample): void => {
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
    });
    run.outcome.warnings.forEach((warning: IAutoMovieAnalysisWarning): void => {
      lines.push(
        JSON.stringify([warning.code, warning.subject, warning.detail]),
      );
    });
  } else lines.push(JSON.stringify([run.outcome.reason, run.outcome.remedy]));
  return lines.join("\n");
};
