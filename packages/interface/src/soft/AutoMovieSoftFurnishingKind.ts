/**
 * Open-ended enough to name a furnishing, closed enough to validate.
 *
 * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Exposes `AutoMovieSoftFurnishingKind` as the portable data boundary for the interior soft anchor host requirement.
 * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `AutoMovieSoftFurnishingKind` for the interior space soft furnishing planting system contract.
 */
export type AutoMovieSoftFurnishingKind =
  | "curtain"
  | "blind"
  | "rug"
  | "cushion"
  | "bed-linen"
  | "membrane"
  | "other";
