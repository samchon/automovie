# src/capture/readAutoMovieCaptureArguments.ts#readAutoMovieCaptureArguments

## @evidence contracts/development/common.md#meaningful-documentation

States the three option forms, what a bare option reads as and why, the value rule, what is left to the reader, and both refusals.

## @evidence contracts/development/implementation.md#principled-implementation

A bare option and an address key without a value both read as the empty string, so one request text means the same switch in either host; a repeat is refused because the reader cannot tell which of two values was meant.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the arguments; the meaning of every key belongs to the reader.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing is guessed from position: a stray value and a repeated option throw.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the number of arguments.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The arguments are read once per run.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one small map and keeps nothing.
