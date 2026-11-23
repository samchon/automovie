# src/geometry/sweep/loadAutoMovieSweepSpine.ts#loadAutoMovieSweepSpine

## @evidence contracts/development/implementation.md#principled-implementation

The record-to-buffer step every spine consumer needs, kept in one place.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Writes the arrays the transport exposes and calls its one recompile.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A zero end tangent is refused here, because in the transport's arrays zero means none.

## @evidence contracts/development/common.md#meaningful-documentation

States what is written and every refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(n) writes plus one `update`.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Called once per compiled spine; the transport is the reuse.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the transport is transferred to the caller.
