# src/composition/AutoMovieScheduleCut.ts#AutoMovieScheduleCut.of

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The cut kinds are told apart by their key; an anchor's instant is read as an `at` reads it, and its share is taken against this intent's duration.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One branch per cut kind and one range check.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every cut is checked to lie in [0, 1] before it is used.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One law call at most, and the anchor lookups of `AutoMovieScheduleWalk`.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Reads the walk's instants and does not repeat them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
