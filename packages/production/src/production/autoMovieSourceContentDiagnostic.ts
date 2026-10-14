import type { IAutoMovieDiagnostic } from "@automovie/interface";
import type { IAutoMovieSourceContentFinding } from "./IAutoMovieSourceContentFinding";
import { autoMovieSourceContentDiagnosticCode } from "./autoMovieSourceContentDiagnosticCode";

/**
 * Attribute one classified finding to a source-phase target and file.
 *
 * @evidence contracts/common.md#principled-implementation Maps the engine kind through the total code policy and preserves finding severity and message; source runtime and library admission callers supply target and path.
 * @evidence contracts/common.md#clear-and-simple-design Owns diagnostic assembly while domain validators own the cause and source folds own occurrence attribution; it does not interpret natural-language messages.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Warnings remain warnings beside errors and no target-specific rule changes a finding's effect or invents a successful outcome.
 * @evidence contracts/common.md#meaningful-documentation States phase, source address inputs and classification preservation; target and path are passed through without path normalization or ownership validation.
 * @evidence contracts/performance.md#efficient-algorithms One constant-size diagnostic and one code lookup take constant time and space, independent of message or source size because strings are referenced.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each diagnostic has occurrence-specific address and message; caching its few assignments would retain source findings without eliminating substantial work.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned diagnostic transfers to the attempt's collector; no store, file, handle or background task is acquired here.
 */
export function autoMovieSourceContentDiagnostic(props: {
  finding: IAutoMovieSourceContentFinding;
  target: string;
  path: string;
}): IAutoMovieDiagnostic {
  return {
    code: autoMovieSourceContentDiagnosticCode(props.finding.kind),
    category: props.finding.severity,
    phase: "source",
    target: props.target,
    path: props.path,
    message: props.finding.message,
  };
}
