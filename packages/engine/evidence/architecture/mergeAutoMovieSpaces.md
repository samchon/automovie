# src/architecture/mergeAutoMovieSpaces.ts#mergeAutoMovieSpaces

## @evidence contracts/development/implementation.md#principled-implementation

Order-preserving concatenation of both lists, so each input's own surface and walkable order survives and the merged space is a pure function of the input order.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two `flatMap` concatenations and nothing else; conflicts are left to `validateSpace`, which owns that rule.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Renames, drops and deduplicates nothing, so a collision surfaces as a validation refusal instead of being hidden.

## @evidence contracts/development/common.md#meaningful-documentation

States the concatenation order, that input ids are dropped, that duplicates are kept and who refuses them, and that surfaces are shared, not copied.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(N + S + W) for N input spaces, S surfaces and W walkable ids: each flatMap visits every space even when its contributed list is empty.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure merge of its arguments that coordinates no work across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the returned space's arrays are new and share the input surface objects.
