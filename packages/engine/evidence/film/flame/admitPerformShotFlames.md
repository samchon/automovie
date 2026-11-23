# src/film/flame/admitPerformShotFlames.ts#admitPerformShotFlames

## @evidence contracts/development/common.md#meaningful-documentation

States every check, the open-fire limits, the binding rules and the absent result on any finding.

## @evidence contracts/development/implementation.md#principled-implementation

Runs the shared flame validator with the props' registered models and practical light bindings, so each cue resolves on the model and binding it will draw and flicker with, and copies the cues only when no gate found anything.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Flame admission lives beside the surface admission helpers, out of performShot; the checks themselves belong to appendFlamesArtifact, which the shot artifact boundary shares.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No cue is repaired; any finding returns no flames.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in cues with one map of nodes, models and bindings, plus one structured clone per admitted cue.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call admits one shot's cues once.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns structured clones; no input is retained.
