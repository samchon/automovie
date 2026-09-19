import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Where one named state holds one anchor.
 *
 * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `IAutoMovieSoftAnchorPose` as the portable data boundary for the interior soft anchor host requirement.
 * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `IAutoMovieSoftAnchorPose` for the interior space soft furnishing planting system contract.
 */
export interface IAutoMovieSoftAnchorPose {
  /**
   * Id of an anchor declared by the same domain.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `anchor` as the portable data boundary for the interior soft anchor host requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `anchor` for the interior space soft furnishing planting system contract.
   */
  anchor: string;

  /**
   * World position that anchor holds in this state.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `position` as the portable data boundary for the interior soft anchor host requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `position` for the interior space soft furnishing planting system contract.
   */
  position: IAutoMovieVector3;
}
