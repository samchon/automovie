# src/geometry/sweep/fitAutoMovieSubdivisionLimit.ts#fitAutoMovieSubdivisionLimit

## @evidence contracts/development/implementation.md#principled-implementation

Interpolating subdivision by inverting the published limit stencils, as Halstead, Kass and DeRose solve for control points whose limit surface interpolates a mesh; Jacobi iteration converges when the stencil matrix's eigenvalues lie in (0, 2), which holds on regular grids (1/9 to 1), and the residual is returned so a cage where it does not hold is detected rather than trusted. Limitation: semi-sharp creases are not modelled, so a cage carrying creases needs its own fit.

## @evidence contracts/development/implementation.md#clear-and-simple-structure `stencilAutoMovieSubdivisionLimit` builds the stencil once from the faces and `solveAutoMovieSubdivisionLimit` runs the plain loop over it, the same two steps a posed rig repeats; the subdivider stays the independent judge of the result.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A cage with non-quads or non-manifold boundaries is refused instead of being fitted with an approximate stencil.

## @evidence contracts/development/common.md#meaningful-documentation

States both stencils and their sources, the solver, its stopping rule, what pinning means and every refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

For V vertices and F quads: stencils in O(F), each sweep O(V + F) over the stencil arrays, at most 2,000 sweeps; a regular grid's slowest mode decays by 8/9 per sweep, so about 200 sweeps reach the tolerance.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call fits one cage; the network sampler calls it once per tier.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the stencil arrays, O(F), and two position buffers, O(V), are released on return except the result, which is transferred.
