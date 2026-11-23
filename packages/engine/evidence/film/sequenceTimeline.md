# src/film/sequenceTimeline.ts#sequenceTimeline

## @evidence contracts/development/implementation.md#principled-implementation

A running cursor accumulates each entry's played span and subtracts its incoming transition, the OpenTimelineIO model of transitions as overlaps, so `runtime` equals the played spans summed minus every transition duration, the value `cutSequence` reports.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Exposes the timeline prepared by preparePlaybackTimeline; frame consumers receive only entries and runtime while the event consumer also uses that preparation's shot index, so overlap arithmetic and duplicate admission have one owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No shot or entry is special-cased; a first-entry transition and a duplicate shot id throw instead of being dropped or resolved by position.

## @evidence contracts/development/common.md#meaningful-documentation

States the layout rule, the precondition and what it guarantees, every throw, that extra shots are allowed, and the unit of the runtime.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass to index the S supplied shots and one pass over the E sequence entries, O(S + E) time and O(S + E) space; the index is required to resolve each entry's shot in constant time and to refuse duplicate ids.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates the index and layout to preparePlaybackTimeline, also consumed by sequenceEventTimeline without rebuilding the shot index; frame callers reuse the returned timeline across queries, with no cross-call cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The shot index is released on return; the result owns one entry record per sequence entry, which lives as long as the caller keeps the timeline.
