# src/capture/index.ts#readAutoMovieVideoSceneCuts

## @evidence contracts/development/common.md#meaningful-documentation

States the report's form, which values are read and their fallback, what is ignored, what an empty report means, and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The `metadata` filter prints one header line per frame and one `key=value` line per entry, and `scdet` sets `lavfi.scd.score` on every frame and `lavfi.scd.time` on a changed one, so grouping lines under their header gives one cut per marked frame.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the lines, closing a cut at each new header and at the end.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A frame missing its score throws instead of being dropped or given a score of zero.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the report's length.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of one text.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh list and keeps nothing.
