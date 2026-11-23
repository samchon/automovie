# src/film/playbackEntryTime.ts#playbackEntryTime

## @evidence contracts/development/implementation.md#principled-implementation

An entry plays its retained source from `offset` at `playbackRate` source seconds per output second from its output `start`, so the shot-local second is the affine map `offset + (seconds - start) × rate`, the OpenTimelineIO source-range mapping the sequence models.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The one owner of an entry's clock: `playbackSampleAt` reads both its times through it, and the draw page and the viewer read an outgoing layer's clock at sub-frame seconds through it, so no caller writes the map again.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No clamping or special case; an instant outside the span maps on the same line, which the documentation states.

## @evidence contracts/development/common.md#meaningful-documentation

States the formula, the default rate, both clocks and that the span is not checked.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time: one subtraction, one multiplication and one addition.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure arithmetic map with nothing worth sharing.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
