# src/film/admitPerformShotSurfaces.ts#admitPerformShotSurfaces

## @evidence contracts/development/common.md#meaningful-documentation

States both surface lists, the model-backed checks, the feed camera rule against the live camera, the all-or-nothing copy on any finding and that absent inputs stay absent.

## @evidence contracts/development/implementation.md#principled-implementation

Both gates run against the staged nodes and the supplied registry before any copy, so the artifact holds only admitted tracks; a structured clone detaches nested graphic data from the caller. performShot calls it after the camera gate with the live camera, so a feed of that camera is reported as an authoring finding at its layer instead of reaching the assembled artifact's defect check.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Groups the two prop-surface gates and their copies out of performShot, which keeps the stage order while staying under the file limit.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No track is repaired or partially admitted; a finding anywhere returns both lists absent.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in tracks, keys and layers plus one map of nodes and models per gate.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call admits one shot's authored input once.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns caller-owned copies; no input is retained.
