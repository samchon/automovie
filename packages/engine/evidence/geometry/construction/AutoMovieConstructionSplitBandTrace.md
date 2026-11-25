# src/geometry/construction/AutoMovieConstructionSplitBandTrace.ts#AutoMovieConstructionSplitBandTrace.emit

## @evidence contracts/development/implementation.md#principled-implementation

Copies all arrays and ribbon vectors, so observer mutation cannot change a strip's columns or local state.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One closed event dispatch copies only its present payload.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not evaluate geometry or catch/replace producer failures; the observer contract requires a nonthrowing callback.

## @evidence contracts/development/common.md#meaningful-documentation

Names copy ownership and the absent-sink case.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in one event's payload, only with an observer.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Receives existing computed values and performs no solve.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The sink owns its snapshot; this module retains nothing.

# src/geometry/construction/AutoMovieConstructionSplitBandTrace.ts#AutoMovieConstructionSplitBandTrace.targets

## @evidence contracts/development/implementation.md#principled-implementation

Only known backward indices become absent-forward-target records; every forward logarithm is preserved.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One index-preserving map.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not turn an unavailable forward target into zero or a backward column.

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes absent forward targets from finite logarithms.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the column count and backward membership.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A value conversion coordinates no producer work.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns an invocation-owned value array.
