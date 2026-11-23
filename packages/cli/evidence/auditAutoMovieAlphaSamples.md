# src/auditAutoMovieAlphaSamples.ts#auditAutoMovieAlphaSamples

## @evidence contracts/development/common.md#meaningful-documentation

States what is checked, how samples are located and each finding it returns.

## @evidence contracts/development/implementation.md#principled-implementation

Locates samples through the ISO base media sample table, sizes from stsz, chunk membership from stsc and chunk offsets from stco or co64, and hashes each sample against its frame file.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Box reading reuses AutoMovieMp4Boxes; the sample-table walk is a private helper beside it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The first differing sample is reported rather than every one; an unreadable table is a probe finding, not a pass.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in samples and frame bytes; each sample and file is read once.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It computes afresh from its arguments; nothing is shared between calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One file handle, closed in a finally block; one sample's bytes are held at a time.
