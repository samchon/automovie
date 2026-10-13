import { IAutoMovieSoftAnchorPose } from "./IAutoMovieSoftAnchorPose";

/** One named configuration of a panel's anchors. */
export interface IAutoMovieSoftNamedState {
  /** Stable state identity within the domain, such as `open` or `closed`. */
  id: string;

  /**
   * Anchors this state moves. Anchors absent from the list keep their declared
   * position, so `open` states only the rings that actually gather.
   */
  anchors: IAutoMovieSoftAnchorPose[];
}
