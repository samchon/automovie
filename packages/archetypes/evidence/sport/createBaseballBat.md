# src/sport/createBaseballBat.ts#createBaseballBat

## @evidence contracts/development/implementation.md#principled-implementation

Stack cylindrical knob, handle, taper and barrel sections so the model's mass properties follow from its shape.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Draw the profile and build its parts and contacts at the same dimensions.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The taper retains three equal steps and the recorded profile supplies the mass and length.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

The profile has a fixed number of parts and contacts.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Saved recipes call this producer with the original seed namespace and geometry.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Each call returns an independent model and retains no inputs.

## @evidence contracts/development/common.md#meaningful-documentation

Describes the local frame, input defaults and the contacts consumed by motion.
