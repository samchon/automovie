/**
 * The unit a capacity or a demand is stated in.
 *
 * @evidence requirements/interior/services-and-environment.md#interior-service-capacity-environment Exposes `AutoMovieServiceUnit` as the portable data boundary for the interior service capacity environment requirement.
 * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract Types `AutoMovieServiceUnit` for the interior space service network contract system contract.
 */
export type AutoMovieServiceUnit =
  | "cubic-meter-per-second"
  | "watt"
  | "ampere"
  | "bit-per-second"
  | "dimensionless";
