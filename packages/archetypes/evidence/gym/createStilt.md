# src/gym/createStilt.ts#createStilt

## @evidence contracts/development/implementation.md#principled-implementation

One pole and one platform at its height.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Draw the dimensions, a rod and a box, two contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No straps or springs are modelled; the sizes are estimates.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two primitives.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States how it stands and its two contacts.
