# src/validation/appendShotCoverageArtifact.ts#appendShotCoverageArtifact

## @evidence contracts/development/implementation.md#principled-implementation

Each admitted take names a camera, optionally resolves it in the scene, differs from the hero and is unique within coverage; cameraMotion must be null or a canonically admitted clip and cameraIntent uses the shared intent owner.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Coverage owns alternate-camera identity rules while clip and intent checks remain shared, preserving the original take order and diagnostic paths after extraction.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A missing scene index does not invent camera existence proof, absent cameraMotion is reported rather than defaulted, and indexed traversal refuses missing resident takes. Structural admission does not prove visual coverage or a rendered angle.

## @evidence contracts/development/common.md#meaningful-documentation

States hero-camera exclusion, duplicate first-index reporting, nullable scene context, required null-or-clip field and delegated intent meaning.

## @evidence contracts/development/implementation.md#efficient-algorithms

T takes require expected O(T) camera-map work plus their nested clip/intent populations and message lengths, with O(T+F) identity/findings storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One camera-to-first-index map handles all duplicates, and both primary/coverage intents reuse the same extracted validator rather than a second rule implementation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller retains appended findings and any offending clip references; the temporary camera map is discarded and no take playback or GPU task is acquired.
