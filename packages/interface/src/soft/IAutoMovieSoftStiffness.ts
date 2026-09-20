/**
 * How hard each constraint family pulls, each in `[0, 1]`.
 *
 * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `IAutoMovieSoftStiffness` as the portable data boundary for the interior soft anchor host requirement.
 * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `IAutoMovieSoftStiffness` for the interior space soft furnishing planting system contract.
 */
export interface IAutoMovieSoftStiffness {
  /**
   * Row and column neighbours: resists stretching.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `structural` as the portable data boundary for the interior soft anchor host requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `structural` for the interior space soft furnishing planting system contract.
   */
  structural: number;

  /**
   * Diagonal neighbours: resists shearing, which is what makes cloth drape.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `shear` as the portable data boundary for the interior soft anchor host requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `shear` for the interior space soft furnishing planting system contract.
   */
  shear: number;

  /**
   * Second neighbours along a row or column: resists folding too sharply.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `bend` as the portable data boundary for the interior soft anchor host requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `bend` for the interior space soft furnishing planting system contract.
   */
  bend: number;
}
