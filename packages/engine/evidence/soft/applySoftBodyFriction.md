# src/soft/applySoftBodyFriction.ts#applySoftBodyFriction

## @evidence contracts/development/common.md#meaningful-documentation

States the law with its source, how the normal and depth are read, the two regimes and the still-collider premise with its consequence for moving capsules.

## @evidence contracts/development/implementation.md#principled-implementation

Position-based Coulomb friction (Macklin et al. 2014) on the projection's own push.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One read of the push, one split of the travel, one correction.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A particle the projection did not move is untouched; a zero coefficient changes nothing.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work per particle.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse; the push is the projection's own.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Writes only the caller's predicted triple.
