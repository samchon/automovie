# src/math/bracketedCrossing.ts#bracketedCrossing

## @evidence contracts/development/common.md#meaningful-documentation

States what is kept on each side, the two stages and why the final width is guaranteed, every input's meaning and the result.

## @evidence contracts/development/implementation.md#principled-implementation

Dowell and Jarratt's Illinois false position on a continuous reading, whose sign test keeps the crossing inside the bracket, completed by bisection, which halves any bracket whatever the reading. The premise for the crossing's uniqueness, a reading that crosses once in the bracket, is the caller's, as it is for a bisection.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One side test shared by both stages; the root search and the halving each own one loop.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No reading is assumed: both ends' sides are the caller's actual readings, a reading that is not a number falls on the side the caller's test gives it, and the width is met by halving, never declared.

## @evidence contracts/development/implementation.md#efficient-algorithms

One reading a step at superlinear order on a smooth reading, bounded by the root search's limit plus the halvings the remaining width needs.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure search; the caller's known end readings are the only values shared.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Holds four numbers for the call and retains nothing.
