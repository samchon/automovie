# src/music/createGuitar.ts#createGuitar

## @evidence contracts/development/implementation.md#principled-implementation

Use equal-tempered fret placement and interpolate string positions between the nut and saddle.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Draw the profile and build its parts and contacts at the same dimensions.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Strings and frets are contacts on the board. The footprint and strings use the recorded bands.

## @evidence contracts/development/implementation.md#efficient-algorithms

Builds 20 frets, six strings and a fixed set of body and neck parts.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Saved recipes call this producer with the original seed namespace and geometry.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Each call returns an independent model and retains no inputs.

## @evidence contracts/development/common.md#meaningful-documentation

Describes the local frame, input defaults and the contacts consumed by motion.
