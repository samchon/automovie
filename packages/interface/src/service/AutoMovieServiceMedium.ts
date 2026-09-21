/**
 * What a system carries.
 *
 * `other` is the deliberate escape hatch: a production carrying medical gas,
 * compressed air or vacuum states `other` and takes the unit check with it,
 * rather than waiting for this union to grow.
 *
 * @evidence requirements/interior/services-and-environment.md#interior-service-network-validation Exposes `AutoMovieServiceMedium` as the portable data boundary for the interior service network validation requirement.
 * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract Types `AutoMovieServiceMedium` for the interior space service network contract system contract.
 */
export type AutoMovieServiceMedium =
  | "cold-water"
  | "hot-water"
  | "waste-water"
  | "vent-air"
  | "supply-air"
  | "return-air"
  | "exhaust-air"
  | "electric-power"
  | "data-signal"
  | "control-signal"
  | "fire-water"
  | "other";
