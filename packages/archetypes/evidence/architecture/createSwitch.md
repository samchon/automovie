# src/architecture/createSwitch.ts#createSwitch

## @evidence contracts/development/implementation.md#principled-implementation

A plate box and one moving face bound to a `button` whose frame faces out of the wall.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Draw the dimensions, build the plate and the face, declare the button.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A rocker is pressed like a button, straight in; its tilt is not modelled.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two parts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States where the control is, which way it faces and what moves.
