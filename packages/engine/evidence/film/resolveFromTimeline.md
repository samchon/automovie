# src/film/resolveFromTimeline.ts#resolveFromTimeline

## @evidence contracts/development/implementation.md#principled-implementation

Binary search over entry starts, valid because a cut timeline's starts are non-decreasing; the last start at or before the instant identifies the live entry because each entry's end is at or after its successor's start, and searching with `<=` lands on the highest of equal starts, the same tie rule as the forward cursor.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Chooses the live entry and hands the sample shape to the shared `playbackSampleAt`, so random access and the forward cursor differ only in how they find the entry.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No entry, shot or position is special-cased; an out-of-range instant is the caller's precondition and is answered by the same search rather than a special branch.

## @evidence contracts/development/common.md#meaningful-documentation

States the live-entry rule and its ties, why it equals the containing entry, its agreement with the cursor, the precondition and the out-of-range answer, and each parameter's role.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(log E) for E timeline entries by binary search over the sorted starts, replacing a full scan per instant; a whole-film sweep should still use `playbackCursor`, which is O(frames + entries).

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Resolves one instant against a timeline the caller built once and passes in; the timeline reuse is the caller's, and this resolver keeps nothing between calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the returned sample is fresh and owned by the caller.
