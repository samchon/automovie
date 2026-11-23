# src/geometry/refineSubdivisionStencils.ts#refineSubdivisionStencils

## @evidence contracts/development/implementation.md#principled-implementation

Applies the same face averages, edge smoothness and vertex masks as refineSubdivisionPoints, composing their affine maps with the incoming source rows; this preserves source vertex identity across a refinement hierarchy.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This function owns symbolic point placement only; refineSubdivisionLevel owns the matching topology and attributes.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No sampled coefficients, geometry tolerances, caller names or finite difference probes are used.

## @evidence contracts/development/common.md#meaningful-documentation

States source-row composition, output order and the distinction from topology refinement; rows and their maps are newly owned by the result.

## @evidence contracts/development/implementation.md#efficient-algorithms

Work is proportional to the source-row terms visited by each local mask; sparse maps merge repeated source indices without a dense V-by-V matrix.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Face stencils are computed once and shared by edge and vertex rules; mask classification reuses the maintained vertex-mask function.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one sparse row per refined vertex; temporary local maps become result rows and no module state is retained.
