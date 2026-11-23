# src/geometry/sweep/rigAutoMovieSurfaceNetwork.ts#rigAutoMovieSurfaceNetwork

## @evidence contracts/development/implementation.md#principled-implementation

A multi-block structured cage: each block samples its defining surface on a regular grid, blocks weld by exact identity, the limit fit inverts the subdivision stencils for samples of authored surfaces and keeps blend controls, and posing is sweep-based deformation split into its pose-invariant compile and per-pose evaluation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Patch layout is delegated to `planAutoMovieSurfaceRigPatches`; one compile records, per vertex, the writer that evaluates it; the rest cage and every pose run the same writers, and `sampleAutoMovieSurfaceNetwork` is this rig at rest. Vertex registration, face layout, sweeps, curves, Coons patches, bridges, bones and the fit are their own modules.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No vertex is welded by proximity and no gap is stitched; bindings naming nothing are refused; a rest fit that does not converge is refused, and every pose returns its residual.

## @evidence contracts/development/common.md#meaningful-documentation

States each fill rule and its source, the welding identity, the topology guarantee, the fit and why blends are held, pinning, the UV default, the posing rules and every refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

Compile, for P patches, V vertices and F faces: O(P log P) patch ordering plus O(V) map operations and sweep queries, O(F) for the orientation check and stencils, plus each sweep's compile and O(N) requested construction writers and reads. Pose: O(V) writers of constant size, each bound sweep's and curve's update including O(N) registered observation frame/scale slots, O(n r) per bridge and the fit's O(V + F) per Jacobi sweep, with no allocation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shapes, Coons weights, Hermite weights, stencils and rest volumes are computed once; shared identities reuse their compiled geometric writers and sampling coefficients. Each emitted vertex is written once, while each curve endpoint read reevaluates its shared field's one to three terms; endpoint values are not cached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains the cage record, one writer per vertex or blend, four position buffers of 3 V numbers, the stencils, and each sweep's and curve's rig with its compiled surface, whose row cache `compileAutoMovieSweep` bounds at 8,192 rows and which posing does not grow; requested construction temporarily adds one writer per sample, clears those writers after reading, and retains the registered observation frame/scale slots and the separate rest snapshot until the rig is released.
