# src/production/IAutoMoviePlaybackEntry.ts#IAutoMoviePlaybackEntry

## @evidence contracts/development/design.md#principled-representation `start` is the previous entry's end minus this entry's transition duration and the output span is `[start, start + played)`, so an output second `t` inside it maps to the shot-local second `offset + (t - start) * (playbackRate ?? 1)`, the affine map every playback resolver applies.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Keeps the sequence index beside the shot id because one shot may play in several entries, and the index is what reaches the entry's own transition; the end is derived as `start + played` instead of stored twice.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No entry is special-cased by position or shot: the first entry starts at zero only because it has no transition, which `sequenceTimeline` requires rather than defaulting.

## @evidence contracts/development/common.md#meaningful-documentation

States the producer, the order and monotonic starts, when two starts coincide, and for each field its clock, unit, and how source duration and rate determine the output span.
