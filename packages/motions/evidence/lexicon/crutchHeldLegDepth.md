# src/lexicon/crutchHeldLegDepth.ts#crutchHeldLegDepth

## @evidence contracts/development/common.md#meaningful-documentation

States the levels, the point and the signed distance returned.

## @evidence contracts/development/implementation.md#principled-implementation

The signed distance to a union of axis-aligned regions, each level solid below its height between where it and the next begin: outside, the Euclidean distance to the nearest region; inside, the depth to the region's nearest face. This is the signed distance TrajOpt's collision term reads (Schulman et al. 2014, section IV-A).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the levels.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None: a closed form per level.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(levels).

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Allocates nothing.
