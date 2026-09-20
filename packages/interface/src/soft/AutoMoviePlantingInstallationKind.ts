/**
 * Open-ended enough to name an installation, closed enough to validate.
 *
 * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `AutoMoviePlantingInstallationKind` as the portable data boundary for the interior soft anchor host requirement.
 * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `AutoMoviePlantingInstallationKind` for the interior space soft furnishing planting system contract.
 */
export type AutoMoviePlantingInstallationKind =
  | "potted"
  | "planter"
  | "green-wall"
  | "aquatic"
  | "other";
