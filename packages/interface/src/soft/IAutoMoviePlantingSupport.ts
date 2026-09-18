/**
 * What a planting is carried by.
 *
 * Every arm cites an existing stable id of the built environment rather than
 * restating geometry: the building graph owns spaces, elements, boundaries and
 * support patches, and moving one of them must invalidate the planting bound to
 * it.
 *
 * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-simulation-bound Exposes `IAutoMoviePlantingSupport` as the portable data boundary for the interior soft simulation bound requirement.
 * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `IAutoMoviePlantingSupport` for the interior space soft furnishing planting system contract.
 */
export type IAutoMoviePlantingSupport =
  | IAutoMoviePlantingSupport.ISurface
  | IAutoMoviePlantingSupport.IElement
  | IAutoMoviePlantingSupport.IBoundary;
export namespace IAutoMoviePlantingSupport {
  /**
   * A support patch assigned to a logical space: a floor, a roof deck.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `ISurface` as the portable data boundary for the interior soft anchor host requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `ISurface` for the interior space soft furnishing planting system contract.
   */
  export interface ISurface {
    /**
     * Discriminator.
     *
     * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `kind` as the portable data boundary for the interior soft anchor host requirement.
     * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `kind` for the interior space soft furnishing planting system contract.
     */
    kind: "surface";
    /**
     * Support-patch id inside the owning environment.
     *
     * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `surface` as the portable data boundary for the interior soft anchor host requirement.
     * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `surface` for the interior space soft furnishing planting system contract.
     */
    surface: string;
  }

  /**
   * A visible element: a planter box, a shelf, a suspended basket rail.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `IElement` as the portable data boundary for the interior soft anchor host requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `IElement` for the interior space soft furnishing planting system contract.
   */
  export interface IElement {
    /**
     * Discriminator.
     *
     * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `kind` as the portable data boundary for the interior soft anchor host requirement.
     * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `kind` for the interior space soft furnishing planting system contract.
     */
    kind: "element";
    /**
     * Element id inside the owning environment.
     *
     * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `element` as the portable data boundary for the interior soft anchor host requirement.
     * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `element` for the interior space soft furnishing planting system contract.
     */
    element: string;
  }

  /**
   * A separation the planting is trained against: the wall of a green wall.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `IBoundary` as the portable data boundary for the interior soft anchor host requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `IBoundary` for the interior space soft furnishing planting system contract.
   */
  export interface IBoundary {
    /**
     * Discriminator.
     *
     * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `kind` as the portable data boundary for the interior soft anchor host requirement.
     * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `kind` for the interior space soft furnishing planting system contract.
     */
    kind: "boundary";
    /**
     * Boundary id inside the owning environment.
     *
     * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `boundary` as the portable data boundary for the interior soft anchor host requirement.
     * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `boundary` for the interior space soft furnishing planting system contract.
     */
    boundary: string;
  }
}
