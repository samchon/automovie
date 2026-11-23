# src/props/createFireExtinguisher.ts#createFireExtinguisher

## @evidence contracts/development/implementation.md#principled-implementation

A cylinder, a valve, a handle, a lever on a hinge, a pin on a slider and a horn.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Record the size, lay the parts, then the contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The valve's proportions, lever travel and pin pull are named estimates; height, diameter, width and mass are read.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Six parts and six contacts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Keeps no inputs.

## @evidence contracts/development/common.md#meaningful-documentation

States the read size, the frame and each contact.
