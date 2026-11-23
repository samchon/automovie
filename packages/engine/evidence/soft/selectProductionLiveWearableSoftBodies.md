# src/soft/selectProductionLiveWearableSoftBodies.ts#selectProductionLiveWearableSoftBodies

## @evidence contracts/development/implementation.md#principled-implementation

The canonical unknown-list admission feeds id-keyed shot-domain matching, preserving authored subjectIndex and total maxSubjects. Typed domain fields remain a premise and empty selections are valid only for static shot domains.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Production-wide budget identity is kept separate from shot-local availability; the shared declaration predicate distinguishes static and moving domains on both admission paths.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Missing shot-local domains are the explicit production-list rule rather than a fabricated subject, and incompatible present domains are refused instead of silently skipped.

## @evidence contracts/development/common.md#meaningful-documentation

States list-versus-shot scope, preserved slots, failure cases and unwired host reach.

## @evidence contracts/development/implementation.md#efficient-algorithms

For N selected ids and D shot domains with A anchors/C colliders, expected work is O(N+D+A+C), with O(N+D) lookup/result storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One admitted order, selected-id Set and available-domain Map serve both compatibility checks and output selection; mutable shot records are not cached across builds.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Lookup collections are temporary; returned rows retain the caller-owned domain references and budget scalars until their consuming solve releases them.
