# src/actions/prepareSupportHeldLegs.ts#prepareSupportHeldLegs

## @evidence contracts/development/common.md#meaningful-documentation

States what is read, from which chains, and the null case.

## @evidence contracts/development/implementation.md#principled-implementation

The held legs are fitted by the resolver's own limb fit on a demand of their chains alone; their lowest collider is the collider owner's minimum; a swivel is carried the shorter way round on the ends' common branch.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Collect the held legs' chain bones once, then three readers over them.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A leg whose ends differ in branch, or lack a seed, is not carried and is fitted as the resolver fits it.

## @evidence contracts/development/implementation.md#efficient-algorithms

The chain demand, FK reader and collider minimum are prepared once per interval; each reading fits only the demanded chains.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The prepared FK and collider readers serve every reading of the interval.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds the demand and two prepared readers for the interval's life; each reading's pose ends with it.
