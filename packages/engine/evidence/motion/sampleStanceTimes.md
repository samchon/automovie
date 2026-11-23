# src/motion/sampleStanceTimes.ts#sampleStanceTimes

## @evidence contracts/development/common.md#meaningful-documentation

States the 24 Hz nominal clock, clip-local seconds and exact boundary inclusion.

## @evidence contracts/development/implementation.md#principled-implementation

Uses the existing inclusive uniform motion clock and adds explicit boundaries with finite, admitted seconds. Sorting unique instants preserves chronological observation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Root-only admission and planting use the same sampling without copying FK or contact logic.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An out-of-clip boundary throws. Optional boundaries are never rounded to the nominal grid.

## @evidence contracts/development/implementation.md#efficient-algorithms

Delegates uniform sampling and only allocates and sorts a merged clock when the author supplies boundaries.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each clip owns its clock. No shared grid remains valid across different duration, sample rate or boundary inputs.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the returned grid. Any merge set is synchronous and no resource handle is retained.
