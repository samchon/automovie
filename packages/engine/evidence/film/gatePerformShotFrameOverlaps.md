# src/film/gatePerformShotFrameOverlaps.ts#gatePerformShotFrameOverlaps

## @evidence contracts/development/implementation.md#principled-implementation

Once moves are sorted by start, two moves overlap exactly when some move overlaps its successor, so comparing neighbours is complete; the sort is stable, so equal starts keep authoring order, and the `1e-9` s tolerance absorbs only floating start arithmetic.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The ordering every later camera stage depends on is made once here, before the blocking and camera gates read the lead move.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every move is held to the same rule; an `"auto"` move is exempt because its span is defined to end at the next start, not because of who authored it.

## @evidence contracts/development/common.md#meaningful-documentation

States both violations with their tolerance and path, why `"auto"` never overlaps, the in-place sort, and who reads the sorted order.

## @evidence contracts/development/implementation.md#efficient-algorithms

One `O(f log f)` sort of the frame moves and one linear pass over neighbours, instead of comparing every pair.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One pass over one shot's frame moves; the sorted list itself is the result later stages reuse.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Reorders the caller's list and appends findings to the caller's collector, retaining no state after return. The host's sort may allocate temporary workspace during the call.
