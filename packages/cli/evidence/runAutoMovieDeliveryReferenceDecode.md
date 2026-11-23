# src/index.ts#runAutoMovieDeliveryReferenceDecode

## @evidence contracts/development/common.md#meaningful-documentation

States which inputs are measured, where they are read from, when the call must run and what each medium returns.

## @evidence contracts/development/implementation.md#principled-implementation

Reuses the delivered-video plan and log reader on the encoder's image-sequence input with its own input frame rate, and the soundtrack decode that mirrors the encoder's padding, sample rate, channel count and cut.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Reads the encoder inputs, then runs one picture decode and at most one soundtrack decode through the existing owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An argument vector without a recognizable picture input, or a failed decode, yields uncovered evidence with its reason rather than an empty reference.

## @evidence contracts/development/implementation.md#efficient-algorithms

One decode per medium, run once per delivery after encoding; no pixels or samples are copied.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The reference is measured once per delivery and its result is handed to the audit; nothing repeats it.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The process owner settles each child before the next starts; the call keeps nothing after it returns.
