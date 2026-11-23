# src/math/pointSegmentDistance.ts#pointSegmentDistance

## @evidence contracts/development/implementation.md#principled-implementation

An exactly collapsed first segment represents the query point in the shared constrained segment minimum, preserving exact zero endpoints and scaled tiny-span arithmetic.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The scalar adapter consumes closestPointsBetweenSegments instead of a second squared-length floor and projection formula.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No Number.EPSILON length floor turns short real segments into points; finite-arithmetic failures follow the shared refusal contract.

## @evidence contracts/development/common.md#meaningful-documentation

States metre coordinates, bounded endpoints, exact collapsed behavior and inherited represented precision/refusals.

## @evidence contracts/development/implementation.md#efficient-algorithms

A fixed candidate set supplies the minimum, keeping the scalar query constant in time and temporary storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Supplying the point twice expresses its geometry without duplicating the projection algorithm; collision calls share no cached result.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The witness pair is temporary and only its distance escapes, with no retained input or collision state.
