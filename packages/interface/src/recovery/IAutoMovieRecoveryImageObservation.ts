import type { IAutoMovieRecoveryImageObservationView } from "./IAutoMovieRecoveryImageObservationView";

/**
 * Record the measured foreground support of every supplied view. Each view
 * has one contiguous interval per occupied row and one unclipped
 * eight-connected component. Support rows describe the silhouette in the
 * supplied camera, with no inferred material correspondence between views.
 */
export interface IAutoMovieRecoveryImageObservation {
  /** Identity of the fixed object asserted by the acquisition caller. */
  objectId: string;

  /**
   * Identity of the common right-handed millimetre frame supplied at capture.
   */
  frame: string;

  /** Evidence category retained from acquisition. */
  cohort: "analytic" | "photograph" | "inconsistent-stress";

  /** Foreground rule applied to obtain these support intervals. */
  method: "fixed-background-channel-distance-v1";

  /**
   * Measured views in the input order, with copied chart data and their owned
   * support rows.
   */
  views: IAutoMovieRecoveryImageObservationView[];
}
