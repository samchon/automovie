/**
 * Parent an owner to another node as a relationship (Child-Of), per-component.
 *
 * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-dependencies Exposes `IAutoMovieParentDriver` as the portable data boundary for the motion channel dependencies requirement.
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `IAutoMovieParentDriver` for the performance motion clip keytime interpolation system contract.
 */
export interface IAutoMovieParentDriver {
  /**
   * Discriminator.
   *
   * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-dependencies Exposes `type` as the portable data boundary for the motion channel dependencies requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `type` for the performance motion clip keytime interpolation system contract.
   */
  type: "parent";

  /**
   * Node that follows.
   *
   * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-dependencies Exposes `owner` as the portable data boundary for the motion channel dependencies requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `owner` for the performance motion clip keytime interpolation system contract.
   */
  owner: string;

  /**
   * Node followed.
   *
   * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-dependencies Exposes `parent` as the portable data boundary for the motion channel dependencies requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `parent` for the performance motion clip keytime interpolation system contract.
   */
  parent: string;

  /**
   * Which components of the parent frame are inherited.
   *
   * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-dependencies Exposes `translation` as the portable data boundary for the motion channel dependencies requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `translation` for the performance motion clip keytime interpolation system contract.
   */
  translation: boolean;

  /**
   * Whether the owner inherits the parent rotation.
   *
   * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-dependencies This field declares the corresponding transform dependency.
   * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-rom-control-driver-graph This field declares the corresponding transform dependency.
   *
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `rotation` for the performance motion clip keytime interpolation system contract.
   */
  rotation: boolean;

  /**
   * Whether the owner inherits the parent scale.
   *
   * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-dependencies This field declares the corresponding transform dependency.
   * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-rom-control-driver-graph This field declares the corresponding transform dependency.
   *
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `scale` for the performance motion clip keytime interpolation system contract.
   */
  scale: boolean;
}
