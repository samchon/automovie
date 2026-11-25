# src/carrying/loadedWalkPace.ts#loadedWalkPace

## @evidence contracts/development/common.md#meaningful-documentation

States the measured speeds, the interpolation, the bound and the transfer to a held load.

## @evidence contracts/development/implementation.md#principled-implementation

Linear interpolation between the study's measured means, 4.6 / 4.75 at 40 % of the body's mass.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One piecewise-linear expression.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing is extrapolated past the heaviest measured load; the transfer from a worn to a held load is stated as unmeasured.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
