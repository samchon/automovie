# src/index.ts#decodeAutoMovieRasterPng

## @evidence contracts/development/common.md#meaningful-documentation

States the output layout, the colour types and depths read, how samples become bytes, what alpha holds and why transparency is ignored, where inflation comes from, and every refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Chunk walking, CRC checking, the five row filters with the Paeth predictor and sample unpacking follow the PNG specification (sections 5, 7, 9 and 11); the Compression Streams `deflate` format is the zlib stream an IDAT sequence holds.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Walk the chunks, inflate the joined image data, undo each row's filter, then expand each pixel to RGBA.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Interlaced files are refused rather than read as if they were not; a corrupt or truncated file throws instead of yielding a partial picture.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the file and the pixel count: one CRC pass per chunk, one inflation, one unfiltering pass and one expansion pass, reusing the previous row in place.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The CRC table is shared with the encoder.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds the joined image data, the inflated rows and the returned pixels until the call ends; only the returned picture outlives it.
