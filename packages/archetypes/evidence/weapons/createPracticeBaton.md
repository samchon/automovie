# src/weapons/createPracticeBaton.ts#createPracticeBaton

## @evidence contracts/development/implementation.md#principled-implementation

Build the retained straight display shaft and its two named frames in model space.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Draw the profile and build its parts and contacts at the same dimensions.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The existing inert display geometry uses one plain shaft.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

The profile has a fixed number of parts and contacts.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Saved recipes call this producer with the original seed namespace and geometry.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Each call returns an independent model and retains no inputs.

## @evidence contracts/development/common.md#meaningful-documentation

Describes the local frame, input defaults and the contacts consumed by motion.
