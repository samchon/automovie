# src/physics/solveXpbdSupportComplementarity.ts#solveXpbdSupportComplementarity

## @evidence contracts/development/implementation.md#principled-implementation

Mirtich 1996, chapter 6, as an active-set complementarity solve.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Per round: assemble the held and sliding rows into one system, solve, update the states.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A singular system returns null for the caller's fallback.

## @evidence contracts/development/implementation.md#efficient-algorithms

One dense solve over the rows per round, at most twice the rows' count of rounds.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each round's system differs from the last.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh array; retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States every row condition, the sliding branch and the round bound.
