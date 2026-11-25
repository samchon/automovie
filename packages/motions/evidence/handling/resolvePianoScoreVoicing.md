# src/handling/resolvePianoScoreVoicing.ts#resolvePianoScoreVoicing

## @evidence contracts/development/common.md#meaningful-documentation

States the input geometry and the shared placement criterion.

## @evidence contracts/development/implementation.md#principled-implementation

Fits one wrist to all keys with a least-squares translation constrained by each finger's forward press placement. Playing fingers start with the canonical straight seed, while idle fingers use the shared plane-aware shapes.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Resolve key geometry, then calculate the wrist and hand shape.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the piano's button frames and the performer's skeleton. The caller admits the fitted contact residuals.

## @evidence contracts/development/implementation.md#efficient-algorithms

Visits each key and its owning digit once during voicing placement.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The score retains the wrist and the digit seeds for all pose samples.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Only the resolved voicing leaves this function.
