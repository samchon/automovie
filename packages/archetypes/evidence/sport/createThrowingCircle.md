# src/sport/createThrowingCircle.ts#createThrowingCircle

## @evidence contracts/development/implementation.md#principled-implementation

A thin ring of the rule's inside diameter, or a runway strip ending at the arc's middle, with one surface contact at the floor.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Draw the figures, then the circle or the runway end.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No stop board, sector lines or cage; the ring's band width and the mass are named estimates; the runway's arc is drawn as its chord.

## @evidence contracts/development/implementation.md#efficient-algorithms

One part.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States the layout, the frame and the contact of each event.
