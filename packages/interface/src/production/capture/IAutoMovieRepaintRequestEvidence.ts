/**
 * Authored owner addresses retained as the decision basis of one immutable repaint request.
 *
 * @evidence contracts/common.md#principled-implementation Prompt, settings, appearance design, screenplay/brief and shot addresses identify the authored decisions the request answers, with a nullable continuity owner where film continuity does not apply.
 * @evidence contracts/common.md#clear-and-simple-design Separate decision addresses make provenance attributable without embedding every owner document or conflating post-generation observation with generation input.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An address is a citation rather than proof that its document was reviewed or its promise realized; this retained record computes no request identity and performs no selection.
 * @evidence contracts/common.md#meaningful-documentation Defines each owner's responsibility and continuity null meaning for immutable request traceability.
 * @author Samchon
 */
export interface IAutoMovieRepaintRequestEvidence {
  /** Prompt and negative-prompt owner. */
  prompt: string;

  /** Applicable versioned continuity owner, or null outside film continuity. */
  continuity: string | null;

  /** Settings decision governing delivery and shared visual grammar. */
  settings: string;

  /** Design owner governing the exact subject or space appearance. */
  design: string;

  /** Screenplay or bounded brief owner that requires the shot. */
  screenplayOrBrief: string;

  /** Exact shot-source owner and acceptance surface. */
  shot: string;
}
