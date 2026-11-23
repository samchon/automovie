# src/handling/pickUpStepReach.ts#pickUpStepReach

## @evidence contracts/development/common.md#meaningful-documentation

States the geometry, controlling ratio and first feasible result.

## @evidence contracts/development/implementation.md#principled-implementation

Intersect the analytic line-sphere roots, then scale the nearest interval endpoint back into step distance.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass computes the intersection.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reach bounds and maximum foot travel are supplied by the caller.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the number of wrist spheres with no search.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call depends on its own line and target geometry.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Pure function retaining no state.
