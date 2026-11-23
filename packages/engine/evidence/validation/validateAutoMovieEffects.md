# src/validation/validateAutoMovieEffects.ts#validateAutoMovieEffects

## @evidence contracts/development/implementation.md#principled-implementation

Validate cue ids, intervals, intensities, compiled stream correspondence, event inclusion and same-zone ordering.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Shot-local maps index streams, events and samples while deterministic zone/start/id sorting exposes interval checks.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The 128-cue policy reports excess without truncating; stream existence is metadata admission, not provider simulation.

## @evidence contracts/development/common.md#meaningful-documentation

Diagnostic field addresses identify source cues and preserve half-open event membership.

## @evidence contracts/development/implementation.md#efficient-algorithms

Sorting C cues costs O(C log C), with one linear indexing pass over each compiled stream, event and sample array.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Event/sample maps are request-local; prior-zone records are shared only within this validation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Maps, sorted wrappers and diagnostics grow with the supplied shot; only diagnostics return and no native stream is created.
