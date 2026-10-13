/**
 * What one lattice edge of a fluid domain does to water, set per edge by
 * {@link IAutoMovieFluidBoundaries}.
 *
 * `wall` reflects: no water crosses and the face velocity is pinned to zero.
 * `open` behaves exactly like a permanently dry neighbouring cell at the same
 * bed height, so water spills off the rim and the volume that left is counted.
 * Water never enters through an `open` edge. Any other string is refused by
 * the engine's fluid-domain validation.
 *
 * @author Samchon
 */
export type AutoMovieFluidBoundaryKind = "wall" | "open";
