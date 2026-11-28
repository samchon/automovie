# src/perform/AutoMovieMotionHumanCue.ts#AutoMovieMotionHumanCue.beats

## @evidence contracts/development/common.md#meaningful-documentation

The declaration identifies film seconds and tempo in beats per minute, the count and meter requirements and defaults, same-time downbeat ordering, and clock and capacity refusals.

## @evidence contracts/development/implementation.md#principled-implementation

Beat index i is at the first film second plus i times 60 divided by tempo. The tempo may be fractional, while count and meter must identify discrete positive safe integers. Index zero and each later index divisible by meter start bars, with the downbeat emitted before the coincident beat. Monotonic nonnegative offsets make the first and last computed seconds sufficient to check finite representation throughout the track.

## @evidence contracts/development/implementation.md#efficient-algorithms

The number of downbeats is the ceiling of count divided by meter. The owner checks array capacity and both clock bounds before emitting a record. It visits each beat once and retains only the complete caller-owned array. The operation keeps no state between calls.
