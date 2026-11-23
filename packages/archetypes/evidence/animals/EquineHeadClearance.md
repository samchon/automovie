# src/animals/EquineHeadClearance.ts#EquineHeadClearance

## @evidence contracts/development/common.md#meaningful-documentation

States the bars checked, the overlap test, the skipped bearing bar and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Capsule overlap is axis-segment distance against the radii sum; the engine's closest-segment query gives the distance.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Read the bars, skip the bearing one, compare each pair.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No tolerance beyond the binary64 margin on the bearing test; an overlap refuses rather than being clamped.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(P) to read the bars, then sixteen constant-size segment queries.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the engine's segment query.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
