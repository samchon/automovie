/**
 * Physical slicing interval for which no supported surface topology is
 * published.
 */
export interface IAutoMovieRecoveryTopologyGap {
  /** Lower section coordinate along the slicing axis, millimetres. */
  beforeMm: number;

  /** Upper section coordinate along the slicing axis, millimetres. */
  afterMm: number;

  /** Why reconstruction cannot consume this interval as supported topology. */
  reason: string;
}
