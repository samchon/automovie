# src/sport/solveGymnasticsLaidArm.ts#solveGymnasticsLaidArm

## @evidence contracts/development/common.md#meaningful-documentation

States the seed, the solve, what is returned and why.

## @evidence contracts/development/implementation.md#principled-implementation

The swivel is the one free coordinate of a two-bone limb on its goal (Tolani, Goswami and Badler 2000, section 3.2.4); placing the laid arm at the carried arm's swivel keeps its branch. The palm's site is laid off the floor by the laid hand's own collider depth along the floor's normal (`handReach`), the hand's hull distance read in its own frame at the goal's turn, so the hand rests on the floor.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One seed, one depth, one seeded resolve, one comparison.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A joint the solve leaves within a nanodegree of the shown one is not returned.

## @evidence contracts/development/implementation.md#efficient-algorithms

One seed read, one hand-reach reading and one seeded resolve per call, with no resolve to measure and repeat; the plants call it once per key.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The limb fit's seed and the resolver.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.
