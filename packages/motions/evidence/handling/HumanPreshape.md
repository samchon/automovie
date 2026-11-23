# src/handling/HumanPreshape.ts#HumanPreshape.open

## @evidence contracts/development/common.md#meaningful-documentation

States width and aperture in metres and clinical joint angles; the namespace explains the unreachable span and the thumb's limit.

## @evidence contracts/development/implementation.md#principled-implementation

Bisection on the thumb-index tip distance (Jeannerod's aperture) over the closed-to-flat blend or, when the flat hand is too narrow, over thumb abduction up to the end of the skeleton's range in the widening sense, so each trial is measured within the joint's limits.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One bisection serves both openings; the blend and the abduction each supply the shape of an opening share.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The returned aperture is the one the shape reaches, never the wanted one; the abduction never passes the joint's range.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most ITERATIONS + 4 aperture reads, each one requested-bone FK, with one prepared aperture reader and blend.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The digit chains and FK workspace are shared by every read of the search.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The aperture reader ends with the call; the returned angles are fresh.
