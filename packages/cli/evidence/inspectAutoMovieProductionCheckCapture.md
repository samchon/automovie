# src/inspectAutoMovieProductionCheckCapture.ts#inspectAutoMovieProductionCheckCapture

## @evidence contracts/development/common.md#meaningful-documentation

Defines sample vs interval, view and pass attribution, capture evidence and failure result.

## @evidence contracts/development/implementation.md#principled-implementation

The existing record gives selected drawn rows and aggregate diagnostic coverage. An interval is admitted only when the requested frame indices have retained stills and checked evidence from the same continuity occurrence and diagnostic identity.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A single view/pass admission precedes the coverage and finding checks so aggregate diagnostics cannot satisfy a differently drawn observation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Candidate, neighboring or unmatched observations stay unresolved. A one-frame observation supplies no credit for adjacent indices.

## @evidence contracts/development/implementation.md#efficient-algorithms

Filters rows and findings to the declared scope. Each retained row checks the relevant coverage ranges and its assigned still, keeping at most the selected rows and frame identities in memory.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The adapter rereads current still availability, uses the caller's existing audit and retains no cross-run decisions.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the record. Per-call arrays and sampled identities scale with the scope; filesystem stats retain no handle.
