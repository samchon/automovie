import type { IAutoMovieSoftAnchorPose } from "./IAutoMovieSoftAnchorPose";

/** Named static override of a panel's anchor targets. */
export interface IAutoMovieSoftNamedState {
  /** Stable state identity within the domain, such as `open` or `closed`. */
  id: string;

  /**
   * Static overrides of the listed anchors. Omitted anchors retain their
   * static/rest targets; complete moving boundaries supersede these initial
   * targets for anchors with a moving binding.
   */
  anchors: IAutoMovieSoftAnchorPose[];
}
