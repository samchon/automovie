import { IAutoMovieSoftAnchorPose } from "./IAutoMovieSoftAnchorPose";

/**
 * One named configuration of a panel's anchors.
 *
 * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-anchors Exposes `IAutoMovieSoftNamedState` as the portable data boundary for the effects soft anchors requirement.
 * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-static-moving-anchor-input Types `IAutoMovieSoftNamedState` for the soft static moving anchor input system contract.
 */
export interface IAutoMovieSoftNamedState {
  /**
   * Stable state identity within the domain, such as `open` or `closed`.
   *
   * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-anchors Exposes `id` as the portable data boundary for the effects soft anchors requirement.
   * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-static-moving-anchor-input Types `id` for the soft static moving anchor input system contract.
   */
  id: string;

  /**
   * Anchors this state moves. Anchors absent from the list keep their declared
   * position, so `open` states only the rings that actually gather.
   *
   * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-anchors Exposes `anchors` as the portable data boundary for the effects soft anchors requirement.
   * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-static-moving-anchor-input Types `anchors` for the soft static moving anchor input system contract.
   */
  anchors: IAutoMovieSoftAnchorPose[];
}
