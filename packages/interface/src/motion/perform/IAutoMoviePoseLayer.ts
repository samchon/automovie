import type { IAutoMoviePose } from "../../pose/IAutoMoviePose";

/**
 * A clinical pose and positive finite contribution weight for per-axis weighted
 * means. Null axes contribute no weight. The last ownsRoot layer is
 * authoritative even when its root is null; otherwise the last non-null root
 * wins.
 */
export interface IAutoMoviePoseLayer {
  /** Borrowed clinical control values; null axes contribute no weight. */
  pose: IAutoMoviePose;

  /**
   * Finite positive contribution weight; only the ratio between co-set layers
   * matters).
   */
  weight: number;

  /**
   * When `true`, this layer's `root` transform is authoritative (the travelling
   * / locomotion layer owns the root). With no owning layer the root falls back
   * to the last non-null one, matching `AutoMovieEngineMotionSampling.mergePoses`.
   */
  ownsRoot?: boolean;
}
