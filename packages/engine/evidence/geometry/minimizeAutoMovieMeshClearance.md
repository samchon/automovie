# src/geometry/minimizeAutoMovieMeshClearance.ts#minimizeAutoMovieMeshClearance

## @evidence contracts/development/implementation.md#principled-implementation

A convex quadratic program: a lumped-mass quadratic objective with box bounds and one linear row per witness, which is exact because depth is affine on each overlap polygon so its vertex witnesses bound the whole polygon, solved by the shared bounded-displacement active-set owner.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Measurement belongs to `measureAutoMovieMeshClearance` and the solve to `solveAutoMovieBoundedDisplacement`; this function only turns witnesses into rows, caps and masses and scales them.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The 1e-7 residual and 40-round budget are solver precision and work bounds, not geometric slack, and a failed solve throws instead of falling back to the conservative per-triangle travel.

## @evidence contracts/development/common.md#meaningful-documentation

States the constraint source, objective and mass rule, the bounds and their meaning, which vertices get variables, the result's order and unit, the scaling, the solver tolerance, every refusal, and what callers must re-check.

## @evidence contracts/development/implementation.md#efficient-algorithms

The measurement dominates for large meshes; mass lumping is one pass over the front triangles, row construction one pass over the witnesses, and the solve works only on vertices with a positive cap and the witness rows that touch them.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One solve per front and back pair in their current positions; a moved surface needs a new measurement and solve.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds every witness, one row per witness and per-variable arrays during the call, bounded by the overlap witness count and capped vertex count, and returns one record per moved vertex.
