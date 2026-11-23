# src/scene/inspection/readAutoMovieCollisionCord.ts#readAutoMovieCollisionCord

## @evidence contracts/development/common.md#meaningful-documentation

States the enclosure argument and segment identity.

## @evidence contracts/development/implementation.md#principled-implementation

Places each capsule on the transformed particle segment with a radius scaled by the world matrix's largest stretch bound.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Capsules for search and one shared lazy tube surface for witnesses.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An enclosing capsule never confirms; only a drawn tube point inside a solid does.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in particles; the tube is posed only for a candidate pair.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

All segments share one tube surface.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Closures borrow the tube for the current observation.
