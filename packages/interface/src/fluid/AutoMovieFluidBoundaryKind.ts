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
 * @evidence contracts/common.md#principled-implementation `simulateFluidDomain` reads the kind on each boundary face: `wall` marks the face blocked so its velocity stays zero (the reflecting condition), and `open` supplies a ghost cell of zero depth at the edge cell's own bed, so the upwind flux can carry water out but has no donor to bring any in.
 * @evidence contracts/common.md#clear-and-simple-design A closed two-value union per edge, holding only the reflecting and spilling conditions the shallow-water integrator implements, with no inflow or periodic kinds it could not honour.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Volume that leaves through an open edge is counted, so the mass balance closes without a correction term; `validateFluidDomain` keeps its own `BOUNDARY_KINDS` set because the union is erased at runtime.
 * @evidence contracts/common.md#meaningful-documentation States what each kind does to velocity and volume, that spilled water is accounted and never returns, where the kind is set, and that unknown strings are refused.
 * @author Samchon
 */
export type AutoMovieFluidBoundaryKind = "wall" | "open";
