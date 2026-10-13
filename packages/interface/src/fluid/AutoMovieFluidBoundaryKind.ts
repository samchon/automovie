/**
 * What one lattice edge of a fluid domain does to water, set per edge by
 * {@link IAutoMovieFluidBoundaries}.
 *
 * `wall` reflects: no water crosses and the edge's face velocity stays zero.
 * `open` behaves like a permanently dry neighbouring cell at the boundary
 * cell's own bed height, so water spills off the rim and the volume that left
 * accumulates in `IAutoMovieFluidState.outflowVolume`. Water never enters
 * through an `open` edge. `validateFluidDomain` refuses any other string.
 *
 * @evidence contracts/common.md#principled-implementation `simulateFluidDomain` treats a `wall` edge face as blocked, pinning its velocity to zero, and an `open` edge face as a dry ghost cell at the interior cell's bed, so the upwind donor of any inward flow is the ghost and every boundary flux is zero or outward.
 * @evidence contracts/common.md#clear-and-simple-design Two closed values cover reflecting and spilling edges; an inflow edge is not offered because declared sources already admit water at a counted cell.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An open edge is the ordinary dry-neighbour rule of the solver rather than a separate absorbing condition, so outflow passes through the same positivity limiter and ledger as interior flow.
 * @evidence contracts/common.md#meaningful-documentation States what each value does to velocity and volume, where spilled volume is counted, that nothing enters through an open edge, and the validator's refusal of other strings.
 * @author Samchon
 */
export type AutoMovieFluidBoundaryKind = "wall" | "open";
