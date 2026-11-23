# src/production/IAutoMoviePlaybackEvent.ts#IAutoMoviePlaybackEvent

## @evidence contracts/development/design.md#principled-representation `globalTime` is `entry.start + (event.time - entry.offset) / (entry.playbackRate ?? 1)`, the same affine map a playback sample uses, and an event exactly on a contiguous trim seam is assigned to one entry by the half-open range rule `sequenceEventTimeline` documents, so it is placed once per on-screen instant.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Extends the interaction event instead of wrapping it, so a consumer reads kind, actor and point directly, and adds only the placement: the entry index, its shot, and both clocks. `shotTime` repeats the inherited `time`; it is kept as the explicit name beside `globalTime` in the published shape, and removing it would change that public type.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No event kind or source is special-cased in placement, and an event outside a play's trimmed range is omitted rather than clamped onto its edge.

## @evidence contracts/development/common.md#meaningful-documentation

States the producer, the per-play emission, the ordering, that inherited fields are unchanged, and for each added field its clock and meaning.
