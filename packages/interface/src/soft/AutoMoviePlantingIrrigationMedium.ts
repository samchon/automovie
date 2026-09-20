/**
 * What an irrigation supply carries.
 *
 * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `AutoMoviePlantingIrrigationMedium` as the portable data boundary for the interior soft anchor host requirement.
 * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `AutoMoviePlantingIrrigationMedium` for the interior space soft furnishing planting system contract.
 */
export type AutoMoviePlantingIrrigationMedium =
  | "potable"
  | "reclaimed"
  | "rainwater"
  | "pond";
