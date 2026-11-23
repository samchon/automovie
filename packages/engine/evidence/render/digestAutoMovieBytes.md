# src/render/digestAutoMovieBytes.ts#digestAutoMovieBytes

## @evidence contracts/development/common.md#meaningful-documentation

The comment names the algorithm, the output format, why no platform digest is used, and that only the final padded blocks are copied.

## @evidence contracts/development/implementation.md#principled-implementation

FIPS 180-4 SHA-256: whole 64-byte blocks are compressed in place, then one or two padded blocks carry the 0x80 terminator and the 64-bit big-endian bit length. Every word is stored in a `Uint32Array` or normalized by `>>> 0`, so the arithmetic is the standard's modulo-2³² arithmetic on every platform. Oracle tests compare against Node's `createHash("sha256")`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One byte digest serves the string digest `autoMovieRenderDigest`, receipt admission and soundtrack identity, so the transform exists once.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The round constants and initial state are the standard's constants; no input is special-cased.

## @evidence contracts/development/implementation.md#efficient-algorithms

Time is linear in the byte count. Storage is a 64-word schedule and at most 128 bytes of padding, independent of input size, because whole blocks are read from the input directly.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call depends only on its bytes and caches nothing.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The state, schedule and padding are call-owned and released on return; only the digest string escapes.
