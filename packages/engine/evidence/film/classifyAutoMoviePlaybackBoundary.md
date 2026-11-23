# src/film/classifyAutoMoviePlaybackBoundary.ts#classifyAutoMoviePlaybackBoundary

## @evidence contracts/development/common.md#meaningful-documentation

States the mapping, boundary ownership, seam rule, transition rule and break interval.

## @evidence contracts/development/implementation.md#principled-implementation

Uses the stateless live-entry search and sample construction that random-access playback uses. A seam compares the outgoing entry's exact retained source end with the incoming trim start, so no tolerance or output spacing decides it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admission, endpoint resolution, edit relation and declared break are four steps in order.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No instant is clamped onto the timeline, no frame step is assumed and a transition is never treated as continuous.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two binary searches over E entries plus a linear pass over B breaks: O(log E + B) time and constant extra space.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the caller's prepared layout and the existing entry search and sample builder.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns new plain records and keeps no reference to the sequence or layout.
