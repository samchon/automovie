/**
 * The act payload: one dramatic movement's purpose, in a sentence or two.
 *
 * @evidence requirements/camera/targets-focus-and-depth-boundary.md#camera-focus-distance Exposes `IAutoMovieActPayload` as the portable data boundary for the camera focus distance requirement.
 * @evidence specifications/camera-light-and-visibility/target-focus-exposure-and-sampling.md#clv-focus-intent-appearance-boundary Types `IAutoMovieActPayload` for the clv focus intent appearance boundary system contract.
 */
export interface IAutoMovieActPayload {
  /**
   * What this act accomplishes dramatically ("the hunt turns on the hunter").
   *
   * @evidence requirements/camera/targets-focus-and-depth-boundary.md#camera-focus-distance Exposes `purpose` as the portable data boundary for the camera focus distance requirement.
   * @evidence specifications/camera-light-and-visibility/target-focus-exposure-and-sampling.md#clv-focus-intent-appearance-boundary Types `purpose` for the clv focus intent appearance boundary system contract.
   */
  purpose: string;
}
