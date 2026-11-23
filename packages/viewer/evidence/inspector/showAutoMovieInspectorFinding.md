# src/index.ts#showAutoMovieInspectorFinding

## @evidence contracts/development/common.md#meaningful-documentation

States the order and why it makes the readout's stop edit agree with the located second.

## @evidence contracts/development/implementation.md#principled-implementation

The playhead and the request both hold the second shown, so both are moved to the witness before any stop edit can be derived from the playhead.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Locate, seek, pause, dispatch.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The located second is the playhead's own after its clamp, so a witness past the end cannot leave the request and the playhead apart.

## @evidence contracts/development/implementation.md#efficient-algorithms

One locate and two playhead changes.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A user action.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Holds nothing.
