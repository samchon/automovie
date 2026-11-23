# src/math/segmentIndex.ts#segmentIndex

## @evidence contracts/development/implementation.md#principled-implementation

Lower-bound search finds the first key at or above a strict-interior time and returns its preceding segment; increasing resident keys and prehandled endpoints make all reads defined.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The accessor serves existing pose/track key records directly, avoiding hot-path time-array materialization.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Exact interior hits choose the ending segment uniformly, without an epsilon or fixture-specific boundary exception.

## @evidence contracts/development/common.md#meaningful-documentation

States strict-interior/length prerequisites, endpoint ownership, inclusive straddling relation, exact-key tie and logarithmic search.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each iteration halves the candidate range, giving O(log N) accessor calls and constant storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The accessor reads existing keys rather than copying equivalent times; no index cache survives key-sequence changes.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only low/high/midpoint indices are live; callback and key storage are not retained after the result returns.
