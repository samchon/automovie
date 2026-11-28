/**
 * A retained unresolved open-arc incidence group across adjacent saved
 * stations.
 */
export interface IAutoMovieRecoveryOpenCurveGroup {
  /** Saved open-curve ordinals on the earlier live cut, possibly empty. */
  before: number[];

  /** Saved open-curve ordinals on the later live cut, possibly empty. */
  after: number[];

  /** Reason ordinary open transport was unresolved for this group. */
  reason: string;
}
