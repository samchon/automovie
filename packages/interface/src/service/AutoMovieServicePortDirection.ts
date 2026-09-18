/**
 * Which way a port faces, stated relative to the node that owns it.
 *
 * @evidence requirements/interior/services-and-environment.md#interior-service-network-validation Exposes `AutoMovieServicePortDirection` as the portable data boundary for the interior service network validation requirement.
 * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract Types `AutoMovieServicePortDirection` for the interior space service network contract system contract.
 */
export type AutoMovieServicePortDirection = "in" | "out" | "bidirectional";
