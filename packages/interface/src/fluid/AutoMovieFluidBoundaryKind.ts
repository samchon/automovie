/**
 * `wall` reflects: no water crosses and the face velocity is pinned to zero.
 * `open` behaves exactly like a permanently dry neighbouring cell at the same
 * bed height, so water spills off the rim and the volume that left is counted.
 *
 * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-initial-boundary-record Exposes `AutoMovieFluidBoundaryKind` as the portable data boundary for the interior fluid initial boundary record requirement.
 * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `AutoMovieFluidBoundaryKind` for the interior space water feature fluid domain system contract.
 */
export type AutoMovieFluidBoundaryKind = "wall" | "open";
