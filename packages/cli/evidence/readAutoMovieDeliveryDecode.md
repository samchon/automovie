# src/readAutoMovieDeliveryDecode.ts#readAutoMovieDeliveryDecode

## @evidence contracts/development/common.md#meaningful-documentation

States the process success premise, the consumed clock and the returned stream evidence.

## @evidence contracts/development/implementation.md#principled-implementation

Uses logged presentation ticks and durations for the full frame grid. Black transitions use carrier frames and frozen starts use unique exact decoded frame matches to FFmpeg's timestamp text. Ignores human-oriented EOF summaries.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Collects input stream inventory and structured filter output, audits the grid, and then pairs detector transitions.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Missing or ambiguous evidence marks the stream uncovered. Does not derive actual end or continuity from the commissioned frame count.

## @evidence contracts/development/implementation.md#efficient-algorithms

Reads the decoder log in one pass with indexed lookups for detector markers. No re-decode or raster conversion is requested.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each successful decode log is read once by its single caller.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The marker indexes live only for the call; the returned evidence is fresh and nothing is retained.
