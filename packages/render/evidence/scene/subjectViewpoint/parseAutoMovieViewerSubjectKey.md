# src/index.ts#parseAutoMovieViewerSubjectKey

## @evidence contracts/development/implementation.md#principled-implementation

Uses the maintained category Set and deterministic first/last delimiter splits, preserving preceding @ inside an id only when a final revision follows.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pure textual boundary supplies a subject record; source lookup and provenance verification remain consumer responsibilities.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Rejects unrecognized syntax instead of guessing category; an unrevisioned id containing @ is interpreted as a revisioned key and whitespace/unverified revision text are not normalized.

## @evidence contracts/development/common.md#meaningful-documentation

States syntax, refusal cases, delimiter ambiguity and lack of source resolution.

## @evidence contracts/development/implementation.md#efficient-algorithms

Scans/copies O(K) key characters with fixed category membership work and a small returned record.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The static category Set is reused; parsed subject records are fresh and no scene identity result is cached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only a fixed category Set is retained by the module; returned strings/record belong to the caller, with no native handles or registry growth.
