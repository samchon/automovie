/**
 * How reachability is traversed from a system's root.
 *
 * @evidence requirements/interior/services-and-environment.md#interior-service-network-validation Exposes `AutoMovieServiceFlow` as the portable data boundary for the interior service network validation requirement.
 * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract Types `AutoMovieServiceFlow` for the interior space service network contract system contract.
 */
export type AutoMovieServiceFlow = "from-root" | "to-root" | "undirected";
