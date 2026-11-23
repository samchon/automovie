# src/drawing/autoMovieDrawingRange.ts#autoMovieDrawingRange

## @evidence contracts/development/implementation.md#principled-implementation

A single comparison fold, which is exact for the extremes of any finite sequence and has no argument-count limit; the stated limitation is that `NaN` compares false and is therefore ignored rather than propagated.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One helper owns the extreme fold for the whole drawing folder, so no caller reintroduces a spread over an unbounded array.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No input size or caller is special-cased; the empty case returns the mathematical identities instead of a sentinel chosen to satisfy one caller.

## @evidence contracts/development/common.md#meaningful-documentation

The comment states why spreading is unsafe, that any iterable works, the empty result and the `NaN` behavior.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass over the `n` values with constant extra space, the minimum for extremes that depend on every value.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure fold over its argument; there is no repeated request to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Holds two numbers during the fold and returns them; nothing is retained.
