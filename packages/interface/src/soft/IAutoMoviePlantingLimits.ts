/**
 * Hard caps a planting recipe promises to stay inside.
 *
 * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `IAutoMoviePlantingLimits` as the portable data boundary for the interior soft anchor host requirement.
 * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `IAutoMoviePlantingLimits` for the interior space soft furnishing planting system contract.
 */
export interface IAutoMoviePlantingLimits {
  /**
   * Branch segments this recipe may emit; a positive integer.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `maxBranches` as the portable data boundary for the interior soft anchor host requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `maxBranches` for the interior space soft furnishing planting system contract.
   */
  maxBranches: number;

  /**
   * Leaf occurrences this recipe may emit; a non-negative integer.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `maxLeaves` as the portable data boundary for the interior soft anchor host requirement.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `maxLeaves` for the interior space soft furnishing planting system contract.
   */
  maxLeaves: number;
}
