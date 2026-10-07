/**
 * A census reading the solved body could not take, named instead of dropped.
 *
 * @author Samchon
 */
export interface IAnsurCensusUnread {
  /** The subject's sex column. */
  sex: string;

  /** The census measure's name. */
  measure: string;

  /** Why the body could not take it. */
  reason: string;
}
