# src/sport/solveGymnasticsLaidArm.ts#solveGymnasticsLaidArm

## @evidence contracts/development/common.md#meaningful-documentation

States the seed, the solve, what is returned and why.

## @evidence contracts/development/implementation.md#principled-implementation

The swivel is the one free coordinate of a two-bone limb on its goal (Tolani, Goswami and Badler 2000, section 3.2.4); placing the laid arm at the carried arm's swivel keeps its branch.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One seed, one seeded resolve, one comparison.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A joint the solve leaves within a nanodegree of the shown one is not returned.

## @evidence contracts/development/implementation.md#efficient-algorithms

One seed read, one seeded resolve and one collider reduction per call, a second resolve only where the hand sinks; the plants call it once per key.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The limb fit's seed and the resolver.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.
