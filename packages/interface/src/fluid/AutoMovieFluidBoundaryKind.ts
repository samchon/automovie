/**
 * Water behavior at one lattice edge, selected by
 * {@link IAutoMovieFluidBoundaries}.
 *
 * Wall pins edge velocity to zero. Open supplies a dry ghost neighbour at the
 * adjacent interior bed height, allowing outward flux counted in
 * IAutoMovieFluidState.outflowVolume without incoming water.
 * validateFluidDomain rejects other strings.
 */
export type AutoMovieFluidBoundaryKind = "wall" | "open";
