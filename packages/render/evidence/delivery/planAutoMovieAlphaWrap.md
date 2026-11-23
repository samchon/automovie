# src/delivery/planAutoMovieAlphaWrap.ts#planAutoMovieAlphaWrap

## @evidence contracts/development/common.md#meaningful-documentation

States the arguments, why each is there, and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Stream copy of an image sequence stores each PNG file as one sample, so the layer is lossless and its samples are checkable against the files; the bit-exact flags and stripped metadata keep the bytes deterministic.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The frame pattern and rate sit where the encode vector puts them, so the delivery audit's reference decode reads both vectors alike.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No audio input or stream is planned, rather than muxing silence.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant size.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It computes afresh from its arguments; nothing is shared between calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It holds no handle, task or state beyond its return value.
