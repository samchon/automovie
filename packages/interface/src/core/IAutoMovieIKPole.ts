/**
 * Pole target controlling which way an IK chain bends.
 *
 * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-dependencies Exposes `IAutoMovieIKPole` as the portable data boundary for the motion channel dependencies requirement.
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `IAutoMovieIKPole` for the performance motion clip keytime interpolation system contract.
 */
export interface IAutoMovieIKPole {
  /**
   * Node the pole points toward, or `null` to use only `angle`.
   *
   * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-dependencies Exposes `node` as the portable data boundary for the motion channel dependencies requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `node` for the performance motion clip keytime interpolation system contract.
   */
  node: string | null;

  /**
   * Pole roll angle in degrees.
   *
   * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-dependencies Exposes `angle` as the portable data boundary for the motion channel dependencies requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `angle` for the performance motion clip keytime interpolation system contract.
   */
  angle: number;
}
