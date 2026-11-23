# src/index.ts#formatAutoMovieInspectorAddress

## @evidence contracts/development/common.md#meaningful-documentation

States the order, the escaping, which characters stay readable and why that is safe, the bare key and the round trip.

## @evidence contracts/development/implementation.md#principled-implementation

The grammar's own writer decides keys and values; `encodeURIComponent` escapes every character that would change the query's structure (`&`, `+`, `#`, `%`, space), and the restored separators are sub-delimiters RFC 3986 allows in a query, which the WHATWG URL parser leaves as they are; `=` inside a value is safe because `URLSearchParams` splits a pair at its first `=` and no grammar key holds one.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One map over the written pairs and one join.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No key or value is written here by hand, so a key the grammar adds reaches the address unchanged.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the length of the written request.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure conversion of one request.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh string and keeps nothing.
