import { IAutoMoviePose } from "@automovie/interface";

/**
 * A clinical pose and positive finite contribution weight for per-axis weighted means. Null axes contribute no weight. The last ownsRoot layer is authoritative even when its root is null; otherwise the last non-null root wins.
 *
 * @evidence contracts/common.md#principled-implementation The representation supplies exactly blendPoses' per-axis numerator/denominator and ordered root-authority policy; inputs use one admitted skeleton and finite clinical angles.
 * @evidence contracts/common.md#clear-and-simple-design One layer couples the pose with its blend weight and optional root authority, leaving temporal envelope selection to the compiler.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Clinical values are absolute controls rather than rest-relative deltas; this type does not reinterpret neutral angles or guarantee ROM safety.
 * @evidence contracts/common.md#meaningful-documentation Documents the weighted-mean rule, positive-weight premise, null axes and root ownership precedence.
 * @evidence contracts/performance.md#efficient-algorithms The type has no runtime cost; blendPoses' work scales with total supplied joint entries and distinct bones.
 * @evidence contracts/performance.md#reuse-equivalent-work Layers reference existing sampled poses instead of copying motion curves; no identity cache or sampling operation belongs to this record.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the layer list and weights, while poses/root values are borrowed; the type holds no external resource.
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
