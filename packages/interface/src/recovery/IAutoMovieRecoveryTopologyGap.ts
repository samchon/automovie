/**
 * Physical bracket whose source event has unresolved topological or numerical
 * support.
 */
export interface IAutoMovieRecoveryTopologyGap {
  /** Lower physical bound of the unresolved bracket in millimetres. */
  beforeMm: number;

  /** Upper physical bound of the unresolved bracket in millimetres. */
  afterMm: number;

  /** Why this source event's precision, link or plateau remains unsupported. */
  reason: string;
}
