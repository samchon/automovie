# src/gym/createSpringboard.ts#createSpringboard

## @evidence contracts/development/implementation.md#principled-implementation

One box of the norm's length, width and front height and an upright surface contact at its top.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Draw the figures, the board, its contact.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The top is level rather than inclined and the springs are not modelled; the mass is an estimate.

## @evidence contracts/development/implementation.md#efficient-algorithms

One part.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States the layout, the frame, the contact and the first pass.
