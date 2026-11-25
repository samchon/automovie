# src/sport/createSphericalBall.ts#createSphericalBall

## @evidence contracts/development/implementation.md#principled-implementation

Build one sphere with the sport's recorded diameter and centre it one radius above the floor.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Draw the profile and build its parts and contacts at the same dimensions.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The models retain a smooth surface. The basketball's, football's and tennis ball's rebounds use their rules' drop references, and the tennis ball's felt slides at the ITF medium court pace; other kinds declare no rebound until a source is read. The inflated balls and the celluloid table tennis ball declare a thin shell's gyration, 2/3, their walls a few hundredths of their radius; the thick-walled and solid kinds declare none.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

The profile has a fixed number of parts and contacts.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Saved recipes call this producer with the original seed namespace and geometry.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Each call returns an independent model and retains no inputs.

## @evidence contracts/development/common.md#meaningful-documentation

Describes the local frame, input defaults and the contacts consumed by motion.
