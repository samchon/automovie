# src/inspector/locateAutoMovieInspectorFinding.ts#locateAutoMovieInspectorFinding

## @evidence contracts/development/common.md#meaningful-documentation

States the target second, how a part path finds its drawn owner and why an unowned path is dropped.

## @evidence contracts/development/implementation.md#principled-implementation

Uses the witness's own clock and the scene's own path listing; part paths extend their owner's path with `/`, `#` or `.`, as the collision and placed-transform checkers write them, and the longest drawn prefix wins, so a drawn name containing a separator is kept whole.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lookup per finding path, then one action.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No path is invented or rewritten into a pattern; duplicates are labelled once.

## @evidence contracts/development/implementation.md#efficient-algorithms

One set and, per path, one probe per separator prefix.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of two small inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new action and keeps nothing.
