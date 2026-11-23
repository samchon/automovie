# src/film/resolveSequencePlayback.ts#resolveSequencePlayback

## @evidence contracts/development/implementation.md#principled-implementation

Builds the output-clock layout with `sequenceTimeline`, rejects instants outside the half-open runtime, and resolves the rest with `resolveFromTimeline`, so the precondition that resolver states is checked here rather than assumed.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A convenience entry that composes the two timeline steps for a caller holding only the sequence and shots; the layout and live-entry rules stay in their owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No instant or shot is special-cased; the `null` for an out-of-range instant is the stated contract, not a fallback for a failure.

## @evidence contracts/development/common.md#meaningful-documentation

States what the sample holds, the `null` range, the per-call timeline build and which API a whole film should use instead, every inherited throw, and each parameter's role.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(S + E) per call to index S shots and lay out E entries, then O(log E) to find the live entry; the rebuild is the price of taking no prebuilt timeline, and the documentation directs repeated queries to the timeline-based resolvers.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Deliberately keeps no timeline between calls: the sequence and shots are plain values with no identity to key a cache on, and a caller that queries repeatedly is pointed at `resolveFromTimeline` with a timeline it owns.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The timeline built per call is released on return; only the returned sample survives, owned by the caller.
