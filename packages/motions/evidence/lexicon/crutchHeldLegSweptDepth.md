# src/lexicon/crutchHeldLegSweptDepth.ts#crutchHeldLegSweptDepth

## @evidence contracts/development/common.md#meaningful-documentation

States the levels, the chord's two places and the signed distance returned.

## @evidence contracts/development/implementation.md#principled-implementation

TrajOpt's swept collision reading (Schulman et al. 2014, IJRR 33:1251, section IV-B): the least signed distance over the chord a point sweeps between two consecutive knots. Each level is a convex region (below its height, between where it and the next begin), and a convex set's signed distance is convex along a chord, so the golden-section search (Kiefer 1953) finds its least. The union's distance is the least over the levels.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One search per level and the least over the levels.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The search's 80 steps bring the unit chord's interval under double precision's resolution of it, 0.618^80 < 2^-52; no tolerance is chosen.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(levels × 80) distance reads.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call reads only its own chord.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Allocates nothing that outlives the call.