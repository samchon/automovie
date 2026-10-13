import { IAutoMoviePose } from "@automovie/interface";

/**
 * One layer in a weighted additive blend: a pose and how much it contributes.
 *
 * @author Samchon
 */
export interface IAutoMoviePoseLayer {
  /** The layer's pose (its joints are rest-relative deltas). */
  pose: IAutoMoviePose;
  /**
   * Contribution weight (any positive scale; only the ratio between co-set
   * layers matters).
   */
  weight: number;
  /**
   * When `true`, this layer's `root` transform is authoritative (the travelling
   * / locomotion layer owns the root). With no owning layer the root falls back
   * to the last non-null one, matching {@link mergePoses}.
   */
  ownsRoot?: boolean;
}
