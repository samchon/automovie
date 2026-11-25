# src/inspectAutoMovieVerificationCapture.ts#inspectAutoMovieVerificationCapture

## @evidence contracts/development/common.md#meaningful-documentation

Defines sample and interval coverage, view and pass attribution, retained stills and the returned verdict.

## @evidence contracts/development/implementation.md#principled-implementation

An interval requires the requested drawn frame indices and checked evidence from its continuity occurrence and diagnostic identity. The selected rows give the actual film-clock bounds for comparing finding intervals. A current still must match the capture writer's encoded SHA-256. A legacy still is decoded to match the recorded size and RGB hash; that hash cannot detect alpha-only changes.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A single view/pass admission precedes the coverage and finding checks so aggregate diagnostics cannot satisfy a differently drawn observation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Selected confirmed errors fail. Candidate or neighboring findings whose episodes touch the selection remain unresolved. An unmatched error with overlapping or unknown affected intervals remains unresolved. Neither a missing still nor a one-frame observation supplies credit for adjacent indices.

## @evidence contracts/development/implementation.md#efficient-algorithms

Filters rows and findings to the declared scope. Only selected rows with checked coverage read their assigned stills. The encoded digest streams without decoding, and legacy PNGs decode one at a time.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The command supplies its verification-local digest reader, so a stable still selected by several checks is hashed once.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the record. The digest stream closes after each file. A legacy still's buffer and decoded pixels are local to its check.
