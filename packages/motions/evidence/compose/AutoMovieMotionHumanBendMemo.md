# src/compose/AutoMovieMotionHumanBendMemo.ts#AutoMovieMotionHumanBendMemo.solve

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the result, its ownership and the refusal rule.

## @evidence contracts/development/implementation.md#principled-implementation

Memoisation of a pure function by its exact arguments: the words are every number the solve reads, each written so two words are equal only when the numbers are the same (negative zero apart from zero), and the body by identity.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One ownership check, one key, one table read, one run.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No rounding of an input, no near goal and no answer for another body; a body whose factory readers were replaced runs every solve.

## @evidence contracts/development/implementation.md#efficient-algorithms

A read costs one key of about twenty numbers and one hash lookup against the sweep's two branches of 360 scored places and their refinements.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Equivalence is the exact equality of every scalar input and the identity of a body whose immutable rig, profile, ranges and hanging arm `createHumanBody` issued; `createHumanBody` requires a new body after the rig or profile is edited, which starts an empty table.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Each body keeps at most `CAPACITY` keys and elbows in a weakly held table that is released with the body; a read moves its key to the newest place and an insert past the capacity drops the oldest.
