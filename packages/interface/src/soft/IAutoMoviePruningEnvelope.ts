import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * The volume a plant is kept inside.
 *
 * A branch whose base is already outside is not grown at all; a branch that
 * crosses the boundary is cut exactly at the crossing, and only the children
 * that emerge before the cut survive. That is pruning, not clipping in the
 * renderer: what the envelope removes is gone from the derived structure every
 * reader of the plant works from. The installation binding's canopy collision
 * check reads that structure today. A quantity take-off would read the same
 * one, and none measures planting yet.
 *
 * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-plant-placement-state Exposes `IAutoMoviePruningEnvelope` as the portable data boundary for the interior plant placement state requirement.
 * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `IAutoMoviePruningEnvelope` for the interior space soft furnishing planting system contract.
 */
export type IAutoMoviePruningEnvelope =
  | IAutoMoviePruningEnvelope.INone
  | IAutoMoviePruningEnvelope.IBox
  | IAutoMoviePruningEnvelope.ISphere;
export namespace IAutoMoviePruningEnvelope {
  /**
   * Unpruned: the structure grows to its full extent.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `INone` as the portable data boundary for the interior soft anchor host requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `INone` for the interior space soft furnishing planting system contract.
   */
  export interface INone {
    /**
     * Discriminator.
     *
     * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `kind` as the portable data boundary for the interior soft anchor host requirement.
     * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `kind` for the interior space soft furnishing planting system contract.
     */
    kind: "none";
  }

  /**
   * An axis-aligned world box: a trained wall, a clipped hedge, a planter.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `IBox` as the portable data boundary for the interior soft anchor host requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `IBox` for the interior space soft furnishing planting system contract.
   */
  export interface IBox {
    /**
     * Discriminator.
     *
     * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `kind` as the portable data boundary for the interior soft anchor host requirement.
     * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `kind` for the interior space soft furnishing planting system contract.
     */
    kind: "box";

    /**
     * Minimum corner.
     *
     * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `min` as the portable data boundary for the interior soft anchor host requirement.
     * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `min` for the interior space soft furnishing planting system contract.
     */
    min: IAutoMovieVector3;

    /**
     * Maximum corner, strictly greater on every axis.
     *
     * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `max` as the portable data boundary for the interior soft anchor host requirement.
     * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `max` for the interior space soft furnishing planting system contract.
     */
    max: IAutoMovieVector3;
  }

  /**
   * A ball: a standard topiary, a hanging sphere.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `ISphere` as the portable data boundary for the interior soft anchor host requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `ISphere` for the interior space soft furnishing planting system contract.
   */
  export interface ISphere {
    /**
     * Discriminator.
     *
     * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `kind` as the portable data boundary for the interior soft anchor host requirement.
     * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `kind` for the interior space soft furnishing planting system contract.
     */
    kind: "sphere";

    /**
     * World centre.
     *
     * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `center` as the portable data boundary for the interior soft anchor host requirement.
     * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `center` for the interior space soft furnishing planting system contract.
     */
    center: IAutoMovieVector3;

    /**
     * Strictly positive radius in metres.
     *
     * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `radius` as the portable data boundary for the interior soft anchor host requirement.
     * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `radius` for the interior space soft furnishing planting system contract.
     */
    radius: number;
  }
}
