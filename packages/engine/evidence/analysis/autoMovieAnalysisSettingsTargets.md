# src/analysis/autoMovieAnalysisSettingsTargets.ts#autoMovieAnalysisSettingsTargets

## @evidence contracts/development/implementation.md#principled-implementation

A field-by-field copy in fixed order turns a structurally typed record into the canonical shape `JSON.stringify` then serializes deterministically, because JSON keeps insertion order and drops nothing else from these four fields.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The four analyzers each digest their targets, so the projection lives once here instead of four identical inline maps that could drift apart.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No field is renamed, rounded or defaulted, and no analyzer or key is special-cased; the copy covers exactly the fields the target contract declares.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation names the copied fields and their order, why the projection keeps the digest canonical, and what it ignores.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One map over the T targets allocating one four-field record each, with no algorithm or strategy to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each analyzer calls it once per study while building that study's settings text; no other phase needs the projection.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns T new records that the caller serializes into the settings text and then drops; this function retains nothing.
