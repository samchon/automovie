# src/scene/decodeAutoMovieImage.ts#decodeAutoMovieImage

## @evidence contracts/development/implementation.md#principled-implementation

Implements PNG chunk parsing, zlib inflation through the standard DecompressionStream "deflate" format and the specification's None, Sub, Up, Average and Paeth reconstruction over bytes of the previous pixel and scanline, then a fixed channel expansion to RGBA8.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function turns a carried image into an owned Texture so the shot cache can treat it exactly like a host-loaded original; admission of the header subset stays in engine.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Unsupported depths, colour types, interlacing and filters reject instead of approximating, and the browser image decoder is not used because its colour management varies by host.

## @evidence contracts/development/common.md#meaningful-documentation

States the decoded subset, row orientation, absent colour management, sampling defaults, the unchecked CRC and which faults reject.

## @evidence contracts/development/implementation.md#efficient-algorithms

For encoded bytes B and pixels P, base64 decoding, chunk walking and IDAT joining cost O(B), inflation is streamed by the platform and reconstruction plus expansion cost O(P) with one raw and one RGBA buffer.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The shot cache calls this at most once per carried image id and shares the decoded Source across bindings; the decoder itself keeps no cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Encoded, joined and inflated buffers expire with the call; the returned texture and its RGBA buffer transfer to the caller, which the shot cache retires.
