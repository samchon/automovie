# src/framePattern.ts#framePattern

## @evidence contracts/development/implementation.md#principled-implementation

ffmpeg's image2 demuxer reads `%0Nd` as a zero-padded decimal frame number, the same text `frameName` writes, so the two cannot disagree when called with equal arguments.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The single render, the sequence and chunk plans and `guidePassFramePattern` build their encoder input through this one function, beside `frameName`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The caller's extension and pad are interpolated as given, with no extension or width special-cased.

## @evidence contracts/development/common.md#meaningful-documentation

The doc gives an example, the naming call it matches, and how ffmpeg reads it.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One template interpolation of the pad and extension chooses no algorithm.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pattern is formatted once per encode, cheaper than caching it.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The pattern string goes to the caller's argument list and nothing is kept or opened.
