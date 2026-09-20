/** Stable authored evidence addresses retained by one repaint request. */
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
