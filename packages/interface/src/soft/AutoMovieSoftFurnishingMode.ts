/**
 * How a bound furnishing is evaluated over shot time.
 *
 * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-simulation-bound Exposes `AutoMovieSoftFurnishingMode` as the portable data boundary for the interior soft simulation bound requirement.
 * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Types `AutoMovieSoftFurnishingMode` for the interior space soft furnishing planting system contract.
 */
export type AutoMovieSoftFurnishingMode = "rest" | "simulated";
