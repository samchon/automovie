# src/film/flame/admitPerformShotFlames.ts#admitPerformShotFlames

## @evidence contracts/development/common.md#meaningful-documentation

States every check, the open-fire limits and their derivation, the binding rules and the absent result on any finding.

## @evidence contracts/development/implementation.md#principled-implementation

Resolves each cue's node and emitter on the registered model as practical light bindings do, bounds an open fire by a positive Heskestad height and by the 0.04 m diameter at which puffing reaches the grid's 7.5 Hz, and requires a bound flame to share its binding's node, emitter and interval so the drawn flame and the light burn together.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Flame admission lives beside the surface admission helpers, out of performShot.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No cue is repaired; any finding returns no flames.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in cues with one map of nodes, models and bindings.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call admits one shot's cues once.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns structured clones; no input is retained.
