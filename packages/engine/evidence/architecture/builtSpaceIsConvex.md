# src/architecture/builtSpaceIsConvex.ts#builtSpaceIsConvex

## @evidence contracts/development/implementation.md#principled-implementation

An intersection of half-spaces is convex by construction, so one cell is convex without inspecting its planes; a shell is not tested for convexity and answers false, which only costs a caller the cheap test and never makes it wrong.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One expression over the two volume spellings, so callers branch on this answer instead of reading `cells` and `shell` themselves.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no space; the conservative false for a convex shell is the stated contract, not an exception.

## @evidence contracts/development/common.md#meaningful-documentation

States why a caller asks, the one true case, and that a convex shell and a volume-less space answer false.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Reads whether a shell is present and the cell count, O(1), so no algorithm or structure is chosen.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Answers for one space value at a time and computes nothing a later convexity question could share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Creates no object and keeps no reference to the space once it returns its boolean.
