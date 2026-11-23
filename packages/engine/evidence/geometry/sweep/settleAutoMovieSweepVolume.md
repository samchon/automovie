# src/geometry/sweep/settleAutoMovieSweepVolume.ts#settleAutoMovieSweepVolume

## @evidence contracts/development/implementation.md#principled-implementation

The secant method on the one-dimensional volume equation, started from the area law, the rescaling step of sweep-based deformation's volume preservation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One search shared by `poseAutoMovieSweep` and posed rigs, which differ only in how they evaluate the volume.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The step count, tolerance and lower bound are fixed and stated, not tuned per caller.

## @evidence contracts/development/common.md#meaningful-documentation

States the starts, the stopping rules, the bound and the source.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most ten volume evaluations and no allocation of its own.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A search; the caller's volume function owns any reuse.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
