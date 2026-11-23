# src/compose/AutoMovieMotionHumanInterrupt.ts#AutoMovieMotionHumanInterrupt

## @evidence contracts/development/common.md#meaningful-documentation

States what a row is and what the names replace.

## @evidence contracts/development/design.md#principled-representation

A window is named by the phrase instant that opens it, the way the action clock names time; a blend is named by how abrupt the cancel is.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two unions, one table and two functions; the only owner of named cancel rows.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The result is the existing `HumanInterruptRow`, so a row no name states is still written by hand beside the named ones.

# src/compose/AutoMovieMotionHumanInterrupt.ts#AutoMovieMotionHumanInterrupt.row

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the fixed kind and entry of the result.

## @evidence contracts/development/implementation.md#principled-implementation `anytime` is the whole action; the other windows open at the named phrase instant and close at the end.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One exhaustive switch and one record.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No share of the duration is typed: a window opens at an instant the action's clock resolves.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse or cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanInterrupt.ts#AutoMovieMotionHumanInterrupt.table

## @evidence contracts/development/common.md#meaningful-documentation

States the input and the result's consumer.

## @evidence contracts/development/implementation.md#principled-implementation

Each entry becomes a one-row list through `row`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the entries.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Adds no row the caller did not state.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates every row to `row`.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Linear in the entries, with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.
