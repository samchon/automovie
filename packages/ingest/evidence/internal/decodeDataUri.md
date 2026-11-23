# src/internal/decodeDataUri.ts#decodeDataUri

## @evidence contracts/development/implementation.md#principled-implementation

Base64 terminal sextets have four zero low bits before two padding characters or two zero low bits before one; the terminal alphabet subsets encode those RFC 4648 canonical conditions. Complete percent-octet escapes and UTF-8 literal chunks define the other payload lane.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One decoder owns both data-URI payload lanes shared by buffer and image closure.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Malformed base64 and incomplete escapes throw with the field path instead of permissive byte repair.

## @evidence contracts/development/common.md#meaningful-documentation

Prose explains metadata/base64 selection, percent octets, Unicode literals and caller-owned output.

## @evidence contracts/development/implementation.md#efficient-algorithms

Metadata and payload text drive O(N) work over URI length; percent chunks plus final concatenation retain O(N) temporary bytes, while base64 also creates an intermediate binary string.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each declared data URI is decoded during its own payload admission; resolver effects and mutable sources are not cached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Decoded arrays transfer to the inspector's call-local payload owner; chunk arrays and encoded literals die on return.
