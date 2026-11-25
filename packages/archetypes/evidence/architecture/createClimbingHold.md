# src/architecture/createClimbingHold.ts#createClimbingHold

## @evidence contracts/development/implementation.md#principled-implementation

One rectangle's dimensions own the collider, top face and exposed lip.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Draw the authored dimensions, build one part and place two contacts from its size.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The toe patch matches the whole top face, while the grip stays on the separate front edge. The coarse rectangular profile and bands are identified as provisional.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Builds one part and two contacts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent ledge.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains no inputs after returning the ledge.

## @evidence contracts/development/common.md#meaningful-documentation

States the mounting face, dimension axes and two contact frames.
