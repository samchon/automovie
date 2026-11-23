# src/render/utf8Bytes.ts#utf8Bytes

## @evidence contracts/development/implementation.md#principled-implementation

Decode valid UTF-16 surrogate pairs into code points, replace lone surrogates with U+FFFD and emit canonical 1/2/3/4-byte UTF-8 sequences, matching Node Buffer/TextEncoder semantics for render hashes.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pure byte encoder supports synchronous SHA and FNV callers without depending on an embedder's TextEncoder availability or polyfill.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Replacement is the declared Unicode encoding rule, not a fixture fallback; no locale, id or host-specific path alters bytes.

## @evidence contracts/development/common.md#meaningful-documentation

Docs identify UTF-8, astral pairing and lone-surrogate replacement; the returned number array belongs to the caller.

## @evidence contracts/development/implementation.md#efficient-algorithms

U UTF-16 units require O(U) traversal and O(B) output bytes with B at most three times U; no intermediate code-point array is retained.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

SHA and FNV share this encoding law, while each arbitrary string call creates fresh bytes rather than retaining a content cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only the returned byte array escapes; no encoder instance, native buffer handle or asynchronous task is acquired.
