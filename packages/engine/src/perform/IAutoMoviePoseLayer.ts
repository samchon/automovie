import { IAutoMoviePose } from "@automovie/interface";

/**
 * A clinical pose and positive finite contribution weight for per-axis weighted means. Null axes contribute no weight. The last ownsRoot layer is authoritative even when its root is null; otherwise the last non-null root wins.
 *
 * @evidence contracts/development/design.md#principled-representation The representation supplies exactly blendPoses' per-axis numerator/denominator and ordered root-authority policy; inputs use one admitted skeleton and finite clinical angles.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One layer couples the pose with its blend weight and optional root authority, leaving temporal envelope selection to the compiler.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Clinical values are absolute controls rather than rest-relative deltas; this type does not reinterpret neutral angles or guarantee ROM safety.
 * @evidence contracts/development/common.md#meaningful-documentation Documents the weighted-mean rule, positive-weight premise, null axes and root ownership precedence.
 */
export interface IAutoMoviePoseLayer {
  /** Borrowed clinical control values; null axes contribute no weight. */
  pose: IAutoMoviePose;

  /**
   * Finite positive contribution weight; only the ratio between co-set
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
