# src/AutoMovieMp4Boxes.ts#AutoMovieMp4Boxes.IBox

## @evidence contracts/development/common.md#meaningful-documentation

Names the type and the payload range ends.

## @evidence contracts/development/design.md#principled-representation

A payload range in bytes of the holding buffer, start after the header and end exclusive, which every child walk and field read bounds itself by.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Type and range are all a reader needs to find children and fields.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Ranges are plain offsets checked by `field`, so no reader indexes past its box.

# src/AutoMovieMp4Boxes.ts#AutoMovieMp4Boxes.IFile

## @evidence contracts/development/common.md#meaningful-documentation

Names both payloads and what `undefined` means.

## @evidence contracts/development/design.md#principled-representation

The two top-level payloads a probe reads, each absent when the file has no such box, rather than an empty buffer that would read as a box.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The probe needs `ftyp` for brands and `moov` for everything else; media data is never read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Absence is explicit, so a caller refuses a file without a movie box by name.

# src/AutoMovieMp4Boxes.ts#AutoMovieMp4Boxes.IEdit

## @evidence contracts/development/common.md#meaningful-documentation

Names each field's clock and the empty-edit marker.

## @evidence contracts/development/design.md#principled-representation

One `elst` entry with 64-bit-safe `bigint` durations and media time in their own clocks, and the 16.16 rate split as the box stores it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The audio track reader and the delivery probe both read edit lists; this is the one shape they share.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Values are kept as stored; the probe converts them to safe numbers and refuses larger ones.

# src/AutoMovieMp4Boxes.ts#AutoMovieMp4Boxes.read

## @evidence contracts/development/common.md#meaningful-documentation

States what is read, the absence result and the bound.

## @evidence contracts/development/implementation.md#principled-implementation

Walks top-level box headers by their declared sizes (32-bit, 64-bit or to end of file) and reads only the `ftyp` and `moov` payloads.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop over top-level headers; decoding is left to the other readers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A truncated header, an overrunning box or a payload over 64 MiB throws naming the box rather than returning partial bytes.

## @evidence contracts/development/implementation.md#efficient-algorithms

Reads 16 bytes per top-level box plus the two payloads; media data is skipped.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call reads its own bytes; nothing is shared between calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds one file handle closed on every path, and at most two payloads of 64 MiB each.

# src/AutoMovieMp4Boxes.ts#AutoMovieMp4Boxes.children

## @evidence contracts/development/common.md#meaningful-documentation

States the range listed.

## @evidence contracts/development/implementation.md#principled-implementation

Decodes consecutive box headers inside a payload range, each bounded by the range end.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop that returns typed ranges.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A header that overruns its parent throws instead of being clipped.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the number of children.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call reads its own bytes; nothing is shared between calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It holds no handle or task and retains nothing after returning.

# src/AutoMovieMp4Boxes.ts#AutoMovieMp4Boxes.only

## @evidence contracts/development/common.md#meaningful-documentation

States the absence and repetition rules.

## @evidence contracts/development/implementation.md#principled-implementation

Selects the single child of a type, as the standard requires of boxes such as `mdia` and `stbl`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two overloads separate required and optional boxes for the type checker.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A repeated box throws, because a last-wins choice could read a different box than another reader.

## @evidence contracts/development/implementation.md#efficient-algorithms

One child walk.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call reads its own bytes; nothing is shared between calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It holds no handle or task and retains nothing after returning.

# src/AutoMovieMp4Boxes.ts#AutoMovieMp4Boxes.field

## @evidence contracts/development/common.md#meaningful-documentation

States the bound check and the returned offset.

## @evidence contracts/development/implementation.md#principled-implementation

Returns the absolute offset of a field after checking it ends within its box.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One check reused by every field read.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A short box throws naming the box.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call reads its own bytes; nothing is shared between calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It holds no handle or task and retains nothing after returning.

# src/AutoMovieMp4Boxes.ts#AutoMovieMp4Boxes.clock

## @evidence contracts/development/common.md#meaningful-documentation

States the version layouts and the track-header case.

## @evidence contracts/development/implementation.md#principled-implementation

Reads timescale and duration of `mvhd` and `mdhd` at their version 0 or 1 offsets, and the duration of `tkhd`, which has no timescale.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function for the three header boxes that share the version rule.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A zero timescale throws, because every duration would divide by it.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call reads its own bytes; nothing is shared between calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It holds no handle or task and retains nothing after returning.

# src/AutoMovieMp4Boxes.ts#AutoMovieMp4Boxes.edits

## @evidence contracts/development/common.md#meaningful-documentation

States the empty result and the stored forms.

## @evidence contracts/development/implementation.md#principled-implementation

Reads every `elst` entry at its version's width, signed media time and 16.16 rate.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Returns entries as stored; policy on empty or several edits stays with each caller.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Entries past the box end throw through `field`.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the entry count.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call reads its own bytes; nothing is shared between calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It holds no handle or task and retains nothing after returning.

# src/AutoMovieMp4Boxes.ts#AutoMovieMp4Boxes.handler

## @evidence contracts/development/common.md#meaningful-documentation

States the returned code.

## @evidence contracts/development/implementation.md#principled-implementation

Reads the `hdlr` handler type that names a track's media kind.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lookup through `mdia`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A missing or repeated `mdia` or `hdlr` throws.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time beyond the child walk.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call reads its own bytes; nothing is shared between calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It holds no handle or task and retains nothing after returning.
