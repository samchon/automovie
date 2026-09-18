/**
 * The group payload: why these children belong together (a montage, a duel).
 *
 * @evidence requirements/camera/targets-focus-and-depth-boundary.md#camera-focus-distance Exposes `IAutoMovieGroupPayload` as the portable data boundary for the camera focus distance requirement.
 * @evidence specifications/camera-light-and-visibility/target-focus-exposure-and-sampling.md#clv-focus-intent-appearance-boundary Types `IAutoMovieGroupPayload` for the clv focus intent appearance boundary system contract.
 */
export interface IAutoMovieGroupPayload {
  /**
   * The grouping rationale, in prose.
   *
   * @evidence requirements/camera/targets-focus-and-depth-boundary.md#camera-focus-distance Exposes `rationale` as the portable data boundary for the camera focus distance requirement.
   * @evidence specifications/camera-light-and-visibility/target-focus-exposure-and-sampling.md#clv-focus-intent-appearance-boundary Types `rationale` for the clv focus intent appearance boundary system contract.
   */
  rationale: string;
}
