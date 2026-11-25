# src/sport/createVolleyballNet.ts#createVolleyballNet

## @evidence contracts/development/implementation.md#principled-implementation

Use the chosen FIVB class height and the drawn net width and post offsets to place the net, posts and antennas.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Draw the profile and build its parts and contacts at the same dimensions.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The top height comes from the class. The coarse net and post cross sections retain the named estimates.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

The profile has a fixed number of parts and contacts.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Saved recipes call this producer with the original seed namespace and geometry.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Each call returns an independent model and retains no inputs.

## @evidence contracts/development/common.md#meaningful-documentation

Describes the local frame, input defaults and the contacts consumed by motion.
