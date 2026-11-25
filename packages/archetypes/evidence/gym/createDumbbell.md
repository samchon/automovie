# src/gym/createDumbbell.ts#createDumbbell

## @evidence contracts/development/implementation.md#principled-implementation

The heads' size follows from the mass at steel's density (`AutoMovieArchetypeDensity.STEEL`, EN 1991-1-1's), so no head size is stated beside the mass and the two cannot disagree.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Draw the dimensions, size the heads, lay three rods, one contact.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Round heads stand for the hexagonal ones of a rubber dumbbell, and no maker's sizes were read: every band is an estimate and says so.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three rods.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States how it lies, how the heads are sized and the contact.
