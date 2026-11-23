# src/physics/solvePhysicalFloorChainTarget.ts#solvePhysicalFloorChainTarget

## @evidence contracts/development/common.md#meaningful-documentation

States the fitted quantities, bounded native coordinates and reported residual.

## @evidence contracts/development/implementation.md#principled-implementation

Measures the actual convex patch minimum. Explicit witnesses keep a nonpenetration row, and planted patches without witnesses retain signed clearance beside endpoint height.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Selects the floor constraint once and shares one measurement between the nonlinear residual and its linearization.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses admitted carrier geometry and endpoint goals directly; invalid options or missing geometry are rejected.

## @evidence contracts/development/implementation.md#efficient-algorithms

Reuses the same bounded articulation solve and calculates patch clearance once per row evaluation.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Measures and solves the current chain using invocation-local state.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Borrows transforms and geometry for the current solve and acquires no resource requiring disposal.
