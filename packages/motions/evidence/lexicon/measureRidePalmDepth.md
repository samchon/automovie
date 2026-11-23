# src/lexicon/measureRidePalmDepth.ts#measureRidePalmDepth

## @evidence contracts/development/common.md#meaningful-documentation

States the station, the measured depth and its consumer.

## @evidence contracts/development/implementation.md#principled-implementation

A ray from the station along the palm's normal leaves the palm bone's own skin; the depth is that exit's distance along the normal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Kept apart from the ride's hands so that owner stays within its size; one socket, one station, one ray.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The depth is measured on the body's own skin, not assumed.

## @evidence contracts/development/implementation.md#efficient-algorithms

One ray against the palm bone's surface.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The caller builds the surface rays once and keeps each hand's depth.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
