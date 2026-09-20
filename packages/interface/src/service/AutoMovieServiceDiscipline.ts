/**
 * Which engineering discipline owns a system's rules.
 *
 * @evidence requirements/interior/services-and-environment.md#interior-service-network-validation Exposes `AutoMovieServiceDiscipline` as the portable data boundary for the interior service network validation requirement.
 * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract Types `AutoMovieServiceDiscipline` for the interior space service network contract system contract.
 */
export type AutoMovieServiceDiscipline =
  | "plumbing"
  | "drainage"
  | "electrical"
  | "data"
  | "hvac"
  | "fire"
  | "control";
