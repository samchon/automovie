# src/render/autoMovieRenderDigest.ts#autoMovieRenderDigest

## @evidence contracts/development/implementation.md#principled-implementation

Encode UTF-8 with lone-surrogate replacement and digest the bytes with `digestAutoMovieBytes`, the FIPS 180-4 transform. Node oracle tests cover padding and Unicode boundaries.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Synchronous pure TypeScript hashing serves both browser engine and capture identity paths without Node crypto or asynchronous secure-context dependencies.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The digest's constants are algorithm constants, not fixture answers; malformed UTF-16 follows UTF-8 replacement semantics rather than platform-specific byte guesses.

## @evidence contracts/development/common.md#meaningful-documentation

Docs identify lowercase sha256: output, byte encoding, synchronous portability and comparison with Node's independent digest implementation.

## @evidence contracts/development/implementation.md#efficient-algorithms

B encoded bytes require O(B) encoding and O(B) block work; storage is the encoded number array and its byte copy.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The byte digest is shared with every other byte consumer; equal content can be hashed by multiple owners but no cache is retained over arbitrary input strings.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The encoded bytes are call-owned; only the digest string escapes, with no crypto handle, worker or background promise.
