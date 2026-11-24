# src/picture/encodeAutoMovieRasterPng.ts#encodeAutoMovieRasterPng

## @evidence contracts/development/common.md#meaningful-documentation

States the format, the dropped alpha by default and the RGBA colour type 6 with straight alpha on request, the row filter, where compression comes from and why the call is asynchronous, who can read the result, and both refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The chunk layout, big-endian lengths and CRC-32 over type and data follow the PNG specification; the Compression Streams standard's `deflate` format is the zlib stream (RFC 1950) an IDAT chunk requires.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Rows are packed once, compressed once and wrapped in the three required chunks.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A buffer that disagrees with the size throws instead of writing a truncated image, and a zero-sized picture, which PNG forbids, is refused.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the pixel count: one packing pass, one compression stream and one copy into the file.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The CRC table is shared with the decoder.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds the packed rows and the compressed stream until the file is assembled; the stream ends with the call and nothing is retained.
