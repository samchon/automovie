/**
 * Water behavior at one lattice edge, selected by {@link IAutoMovieFluidBoundaries}.
 *
 * Wall pins edge velocity to zero. Open supplies a dry ghost neighbour at the adjacent interior bed height, allowing outward flux counted in IAutoMovieFluidState.outflowVolume without incoming water. validateFluidDomain rejects other strings.
 *
 * @evidence contracts/development/design.md#principled-representation `simulateFluidDomain` treats a `wall` edge face as blocked, pinning its velocity to zero, and an `open` edge face as a dry ghost cell at the interior cell's bed, so the upwind donor of any inward flow is the ghost and every boundary flux is zero or outward.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two closed values cover reflecting and spilling edges; an inflow edge is not offered because declared sources already admit water at a counted cell.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts An open edge is the ordinary dry-neighbour rule of the solver rather than a separate absorbing condition, so outflow passes through the same positivity limiter and ledger as interior flow.
 * @evidence contracts/development/common.md#meaningful-documentation States what each value does to velocity and volume, where spilled volume is counted, that nothing enters through an open edge, and the validator's refusal of other strings.
 */
export type AutoMovieFluidBoundaryKind = "wall" | "open";
