# src/validation/validateModelImages.ts#validateModelImages

## @evidence contracts/development/implementation.md#principled-implementation

Strict RFC 4648 syntax is checked on the whole string, then the signature and IHDR fields decoded from its prefix are compared with the PNG specification's values for the decoded subset; readAutoMovieImageFacts supplies signature, chunk type and edges.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Image-list admission is one leaf beside material admission; the shared image-facts reader owns PNG dimension parsing and this owner only adds the decoder-subset fields.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Unsupported depths, palettes, interlacing and oversize edges are refused rather than left to a viewer approximation; the documented header-only limit is stated instead of claimed as full decodability.

## @evidence contracts/development/common.md#meaningful-documentation

States the admitted media, base64 form, IHDR subset, edge bound and the header-only limitation with where the remaining faults surface.

## @evidence contracts/development/implementation.md#efficient-algorithms

One linear regular-expression scan per image string and a fixed 33-byte header decode; no pixel data is inflated.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the shared image-facts reader and unique-id validator; images are re-checked per call because the model is caller-owned and mutable.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The decoded header prefix is a temporary 33-byte array; only findings reach the caller's collector.
