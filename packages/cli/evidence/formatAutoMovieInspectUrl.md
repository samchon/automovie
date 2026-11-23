# src/formatAutoMovieInspectUrl.ts#formatAutoMovieInspectUrl

## @evidence contracts/development/common.md#meaningful-documentation

States what the address holds, where the pairs come from, how they are encoded and the empty case.

## @evidence contracts/development/implementation.md#principled-implementation `URLSearchParams` writes `application/x-www-form-urlencoded`, which the page's `URLSearchParams` decodes to the same pairs, so the page reads the request the command was given.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One encoding and one join.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No key is written here; the grammar's writer chose them.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the pairs' length.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure conversion.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh string and keeps nothing.
