# src/math/mixSeed.ts#mixSeed

## @evidence contracts/development/implementation.md#principled-implementation

Safe-integer seed halves enter a fixed unsigned-word avalanche with a domain salt; ECMAScript integer operations are deterministic, while finite output cannot promise collision freedom.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Effects, combat, formation and instance placement share this fold so high seed words are not discarded by individual consumers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Fixed integer constants define the same mixing function for every caller, without ambient randomness or fixture seed remapping.

## @evidence contracts/development/common.md#meaningful-documentation

States safe-integer premise, high-word participation, domain separation and stable unsigned output without an injectivity claim.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two integer multiplications and fixed shifts cost constant time, without constructing seed arrays.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Seed halves are extracted once; folds retain no previous random-stream position across calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only scalar words and the unsigned result exist; no generator instance or entropy resource is retained.
