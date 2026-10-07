/**
 * Source-freshness judgment, independent of the appearance of any frame.
 * @author Samchon
 */
export interface IBodyObservationJudgment {
  /** True when schema, basis, source identity or recorded build freshness differs. */
  stale: boolean;

  /** First reported mismatch, or the empty string when the metadata matches. */
  reason: string;
}
