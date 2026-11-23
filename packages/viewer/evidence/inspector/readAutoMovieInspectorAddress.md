# src/inspector/readAutoMovieInspectorAddress.ts#readAutoMovieInspectorAddress

## @evidence contracts/development/common.md#meaningful-documentation

States the accepted text, how it is decoded, what empty text gives and what a refusal names.

## @evidence contracts/development/implementation.md#principled-implementation `URLSearchParams` is the browser's own query decoder and satisfies the grammar's source as it is, so the page maps its address and parses nothing itself.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Strip one `?`, decode, read.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A refusal reaches the caller; nothing falls back to a default request here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the text.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure conversion of one text.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh request and keeps nothing.
