/**
 * Copy a source node's transform components onto an owner (mirror, follow).
 *
 * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-dependencies Exposes `IAutoMovieCopyDriver` as the portable data boundary for the motion channel dependencies requirement.
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `IAutoMovieCopyDriver` for the performance motion clip keytime interpolation system contract.
 */
export interface IAutoMovieCopyDriver {
  /**
   * Discriminator.
   *
   * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-dependencies Exposes `type` as the portable data boundary for the motion channel dependencies requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `type` for the performance motion clip keytime interpolation system contract.
   */
  type: "copy";
  /**
   * Node whose transform is written.
   *
   * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-dependencies Exposes `owner` as the portable data boundary for the motion channel dependencies requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `owner` for the performance motion clip keytime interpolation system contract.
   */
  owner: string;
  /**
   * Node whose transform is read.
   *
   * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-dependencies Exposes `source` as the portable data boundary for the motion channel dependencies requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `source` for the performance motion clip keytime interpolation system contract.
   */
  source: string;
  /**
   * Which components to copy.
   *
   * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-dependencies Exposes `translation` as the portable data boundary for the motion channel dependencies requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `translation` for the performance motion clip keytime interpolation system contract.
   */
  translation: boolean;
  /**
   * Whether the owner copies the source rotation.
   *
   * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-dependencies This field declares the corresponding transform dependency.
   * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-rom-control-driver-graph This field declares the corresponding transform dependency.
   *
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `rotation` for the performance motion clip keytime interpolation system contract.
   */
  rotation: boolean;
  /**
   * Whether the owner copies the source scale.
   *
   * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-dependencies This field declares the corresponding transform dependency.
   * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-rom-control-driver-graph This field declares the corresponding transform dependency.
   *
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `scale` for the performance motion clip keytime interpolation system contract.
   */
  scale: boolean;
  /**
   * Blend factor `[0, 1]` between the owner's prior value and the copied one.
   *
   * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-dependencies Exposes `influence` as the portable data boundary for the motion channel dependencies requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `influence` for the performance motion clip keytime interpolation system contract.
   */
  influence: number;
}
