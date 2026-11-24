# src/audio/playAutoMovieSoundtrack.ts#playAutoMovieSoundtrack

## @evidence contracts/development/common.md#meaningful-documentation

States what the master is, where it starts, how the rate acts, what a second past the end does, the refusal and what the returned stop does.

## @evidence contracts/development/implementation.md#principled-implementation

The master's sample 0 is film second 0, so a buffer source started now at buffer offset `seconds` plays film second `seconds` now; `playbackRate` plays `rate` buffer seconds per wall second, which is the playhead's rate in film seconds.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One buffer source to the destination, with no gain or pan, because the master is already mixed and levelled.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A negative second or a nonpositive or non-finite rate is refused instead of clamped.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work; the master buffer is shared, not copied.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each start is one source, which Web Audio cannot restart.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One source per call, stopped and disconnected once by the returned stop.
