# src/readAutoMovieDeliveryProbe.ts#readAutoMovieDeliveryProbe

## @evidence contracts/development/common.md#meaningful-documentation

States every box read, how sample timing and colour are derived, the audio branch and each refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Reads ISO/IEC 14496-12 boxes (`ftyp`, `tkhd`, `mdhd`, `elst`, `stts`, `ctts`, `stsd`) and the `avc1` visual sample entry with its `pasp` and `colr` children, and for audio the `mp4a` entry and its `esds` AudioSpecificConfig (ISO/IEC 14496-1 §7.2.6, 14496-3 §1.6.2.1). Composition time is decode time plus the `ctts` offset; a non-constant `stts` reports duration 0 so the profile refuses it; the sRGB identity is the caller's `render` constant, so probe and profile share one definition.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One read of the header boxes, then a video reader and an audio reader over shared track clocks; acceptance stays with the render asserters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing is defaulted to a passing value: absent `colr` is `absent`, a non-AAC entry keeps its type with zero AAC fields, and values beyond the safe integers throw.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the sample-table entries, plus one pass over decode times when `ctts` exists; media data is never read.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call reads its own bytes; nothing is shared between calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds the file handle only inside `AutoMovieMp4Boxes.read` and retains the movie payload until the probe returns.
