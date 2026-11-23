# src/film/preparePlaybackTimeline.ts#preparePlaybackTimeline

## @evidence contracts/development/implementation.md#principled-implementation

A running cursor adds the retained source duration divided by each entry's rate and subtracts the incoming transition overlap; accepted trims and overlaps therefore preserve the cutSequence runtime. Indexing ids first makes every entry lookup unambiguous and preserves the first duplicate's position in its refusal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns layout and its shot index together so event and editorial marker projection use the same placement as frame sampling. Public timeline records need only the layout.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every supplied shot is indexed and every sequence entry is laid out in authored order; extra shots cannot affect timing and duplicate ids are refused rather than resolved by insertion order.

## @evidence contracts/development/common.md#meaningful-documentation

States the accepted-cut precondition, remaining structural refusals, extra-shot behavior and the two returned products; entry start and runtime remain seconds on the output clock.

## @evidence contracts/development/implementation.md#efficient-algorithms

Indexes S supplied shots and lays out E entries in O(S+E) time and space; the index is required for constant-time references and duplicate admission, and the event consumer uses this same completed index instead of building it twice.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares the one supplied-shot index with layout, event and editorial marker placement. Each projection uses the same sequence and shot objects synchronously.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Owns S index entries and E placement records until return, transferring them to the caller for frame or metadata projection. The caller owns those records and no native handle is acquired.
