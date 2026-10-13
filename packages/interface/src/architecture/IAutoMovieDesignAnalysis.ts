import { IAutoMovieDesignAnalysisOutcome } from "./IAutoMovieDesignAnalysisOutcome";

/**
 * One attempted reading of one frame.
 *
 * Every attempt is recorded, including the ones that produced nothing. An
 * `observed` outcome may name only candidates built from marks on
 * {@link frame}, and no candidate may be claimed by two analyses.
 *
 * @evidence contracts/common.md#principled-implementation Records each attempt as an id, a frame, an open label, and a discriminated outcome; `validateDesignReference` requires the frame to resolve and refuses an observed candidate whose primitives lie on another frame, so a reading never inherits a foreign sheet's scale.
 * @evidence contracts/common.md#clear-and-simple-design Four fields; the outcome union alone carries readings or a reason, so the analysis never repeats a status flag of its own.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No analysis label is privileged; `subject` is checked only for being non-blank and is never matched against candidate semantics, and a candidate claimed by a second analysis is refused rather than shared.
 * @evidence contracts/common.md#meaningful-documentation States the id scope, the frame it read, the open label, the single-frame rule for observed candidates, and the single-producer rule.
 * @author Samchon
 */
export interface IAutoMovieDesignAnalysis {
  /** Stable analysis identity within the document. */
  id: string;

  /** Frame this analysis read; must name a frame of the same document. */
  frame: string;

  /** Open label of the reading attempted, such as `wall-centerline`. */
  subject: string;

  /** Honest outcome of the attempt. */
  outcome: IAutoMovieDesignAnalysisOutcome;
}
