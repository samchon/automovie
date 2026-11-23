# src/geometry/sweep/solveAutoMovieSubdivisionLimit.ts#solveAutoMovieSubdivisionLimit

## @evidence contracts/development/implementation.md#principled-implementation

Interpolating subdivision by inverting the limit stencils, as Halstead, Kass and DeRose solve for controls whose limit surface interpolates a mesh; Jacobi converges for the stencil's eigenvalue range on regular grids, and the residual is returned so a cage where it does not hold is detected. Limitation: semi-sharp creases are not modelled.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A plain loop over compressed rows into two caller buffers, so a cage refitted every frame allocates nothing.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every solve starts from the targets, never from a previous frame's controls, so the result depends on this pose alone.

## @evidence contracts/development/common.md#meaningful-documentation

States the system, the solver, its start, its stopping rule, holding and the return value.

## @evidence contracts/development/implementation.md#efficient-algorithms

For V vertices and S stencil terms: O(V + S) per residual/update traversal, at most 2,000 updates and one final residual traversal; a regular grid's slowest mode decays by 8/9 per update, and no buffer is allocated.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The stencils are the reuse; each call solves one set of targets.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; writes only the two caller buffers.
