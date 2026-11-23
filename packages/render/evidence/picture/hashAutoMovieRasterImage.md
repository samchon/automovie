# src/picture/hashAutoMovieRasterImage.ts#hashAutoMovieRasterImage

## @evidence contracts/development/common.md#meaningful-documentation

States the output form, the exact bytes hashed, why compression and alpha are excluded, what equality establishes, and why the digest is written out.

## @evidence contracts/development/implementation.md#principled-implementation

FIPS 180-4 SHA-256: 512-bit blocks, the 64-word message schedule, the round constants of section 4.2.2, and padding with a 0x80 byte and the 64-bit big-endian message length, all in unsigned 32-bit arithmetic.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Lay out the hashed bytes once, then one compression loop over the padded message.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The constants are the standard's; the size is part of the hashed bytes, so two pictures with the same bytes in different shapes differ.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the pixel count: one copy of the RGB bytes and 64 rounds per 64-byte block, with the schedule array reused across blocks.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each still is hashed once by the capture that records it.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds one padded copy of the hashed bytes for the call; only the digest string escapes.
