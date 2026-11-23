# src/render/autoMovieRenderDigest.ts#autoMovieRenderDigest

## @evidence contracts/development/implementation.md#principled-implementation

Encode UTF-8 with lone-surrogate replacement, pad 512-bit blocks with the full bit length, and run SHA-256's 64-word schedule/rounds using normalized 32-bit arithmetic. Node oracle tests cover padding and Unicode boundaries.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Synchronous pure TypeScript hashing serves both browser engine and capture identity paths without Node crypto or asynchronous secure-context dependencies.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Round constants and padding are algorithm constants, not fixture answers; malformed UTF-16 follows UTF-8 replacement semantics rather than platform-specific byte guesses.

## @evidence contracts/development/common.md#meaningful-documentation

Docs identify lowercase sha256: output, byte encoding, synchronous portability and comparison with Node's independent digest implementation.

## @evidence contracts/development/implementation.md#efficient-algorithms

B encoded bytes require O(B) encoding/padding and O(B) block work, with a reused fixed 64-word schedule; storage includes both byte arrays and padded blocks rather than a streaming-memory claim.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One schedule buffer is reused across blocks within a call; equal content can be hashed by multiple owners but no cache is retained over arbitrary input strings.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Bytes, padding, schedule and state are call-owned; only the digest string escapes, with no crypto handle, worker or background promise.
