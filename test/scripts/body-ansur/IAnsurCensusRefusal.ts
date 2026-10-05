/**
 * A census subject the simple tier refused, with its identity card and reason.
 *
 * @author Samchon
 */
export interface IAnsurCensusRefusal {
  /** The subject's sex column. */
  sex: string;

  /** The identity card the simple tier was given. */
  card: unknown;

  /** The refusal's message. */
  reason: string;
}
