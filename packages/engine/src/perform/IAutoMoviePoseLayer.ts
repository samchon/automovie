import { IAutoMoviePose } from "@automovie/interface";

/**
 * One layer in a weighted additive blend: a pose and how much it contributes.
 *
 * @evidence requirements/motion/layers-blends-and-transitions.md#motion-layer-channel-ownership Carries one pose contribution with explicit ownership inputs into composition.
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-layer-mask-transition-composition Defines the concrete layer record consumed by deterministic pose composition.
 * @author Samchon
 */
export interface IAutoMoviePoseLayer {
  /**
   * The layer's pose (its joints are rest-relative deltas).
   *
   * @evidence requirements/motion/layers-blends-and-transitions.md#motion-layer-mask-weight Supplies the pose state admitted by this layer's weighted mask.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-layer-mask-transition-composition Carries the layer-local pose that the specified composition evaluates.
   */
  pose: IAutoMoviePose;
  /**
   * Contribution weight (any positive scale; only the ratio between co-set
   * layers matters).
   *
   * @evidence requirements/motion/layers-blends-and-transitions.md#motion-layer-mask-weight Exposes the explicit weight used instead of an implicit precedence guess.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-layer-mask-transition-composition Supplies the normalized contribution input required by layer composition.
   */
  weight: number;
  /**
   * When `true`, this layer's `root` transform is authoritative (the travelling
   * / locomotion layer owns the root). With no owning layer the root falls back
   * to the last non-null one, matching {@link mergePoses}.
   *
   * @evidence requirements/motion/layers-blends-and-transitions.md#motion-layer-channel-ownership Declares which layer has authority over the root channel.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-layer-mask-transition-composition Implements explicit channel ownership for root composition.
   * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-control-ownership Makes root-channel ownership explicit on each pose layer.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Assigns the root writer through the layer's declared ownership flag.
   */
  ownsRoot?: boolean;
}
