# src/createAutoMovieSubjectPartIndex.ts#createAutoMovieSubjectPartIndex

## @evidence contracts/development/implementation.md#principled-implementation

Indexes complete prototype-part addresses and inserts only absent keys, preserving first-match identity for duplicate part ids while avoiding a new scan for every subject comparison.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lazy lookup serves a diff revision's part comparisons; model selection and subject classification remain with diffAutoMovieSubjects.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Empty requests and missing models do not traverse part arrays, duplicate ids are not changed to last-match selection, and mutable artifacts have no global or revision-id cache.

## @evidence contracts/development/common.md#meaningful-documentation

States lazy indexing, complete address keys, duplicate precedence and the unchanged-table premise for one request.

## @evidence contracts/development/implementation.md#efficient-algorithms

For Q lookups and P parts in models actually queried, expected map work is O(Q+P) plus address-string construction, replacing repeated per-model linear scans.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each queried model is indexed once and its first-match entries serve subsequent lookups; untouched models have no index allocation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned lookup retains the model table and at most one part reference per distinct queried address; its owning diff request releases the closure and maps on return or throw.
