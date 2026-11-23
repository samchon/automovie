# src/render/encodeAutoMoviePng.ts#encodeAutoMoviePng

## @evidence contracts/development/implementation.md#principled-implementation

Writes the PNG chunk layout, zlib header and stored deflate blocks exactly as the W3C PNG and RFC 1950/1951 define them, with the standard reflected CRC-32 (polynomial 0xEDB88320) and Adler-32 (modulus 65521); filter type 0 is valid for every scanline, so any 8-bit image round-trips through a conforming decoder unchanged.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pure function from samples to the base64 string the image record stores; the caller owns the image id, so the encoder is not tied to a model or a material slot.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No compression level, ancillary chunk or colour management is emitted or implied; stored blocks are a declared size trade, not a fallback, and malformed input is refused rather than padded.

## @evidence contracts/development/common.md#meaningful-documentation

States the emitted PNG subset, the encoding steps and their standards, the size cost of stored blocks, units and layout of every input, and each refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

For N pixel bytes the work is O(N): one pass filters rows into the stream, one computes Adler-32, one CRC-32 over the data chunk and one base64 pass; output is O(N) and the 256-entry CRC table is built once per module.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The CRC table is the one shared result; each call encodes its own pixels, and a caller that encodes the same pixels twice owns any cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only the returned string escapes; the intermediate byte buffer is released with the call and the module retains just the fixed 1 KiB CRC table.
