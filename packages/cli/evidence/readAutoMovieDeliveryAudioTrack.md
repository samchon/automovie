# src/readAutoMovieDeliveryAudioTrack.ts#readAutoMovieDeliveryAudioTrack

## @evidence contracts/development/common.md#meaningful-documentation

States the boxes read, how they combine and what each result means.

## @evidence contracts/development/implementation.md#principled-implementation

Follows ISO/IEC 14496-12: `stts` sums exact sample durations, a single `elst` edit at rate one skips `media_time`, and a segment shorter than the media by a whole movie tick ends it, rescaled from the movie clock with FFmpeg's nearest rounding. FFmpeg creates one stream per `trak` in file order.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Walks top-level box headers to the movie box, then reads the selected track's four boxes.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Empty edits, several edits, a non-unit rate, a non-audio track, a truncated box or an unsafe integer give an uncovered reason instead of an estimate.

## @evidence contracts/development/implementation.md#efficient-algorithms

Reads only box headers until the movie box and never the media data. Sums the run-length sample table once.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each delivery attempt reads its own candidate once; nothing is shared between attempts.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains only the movie box, refuses one above 64 MiB and closes the file handle on every path.
