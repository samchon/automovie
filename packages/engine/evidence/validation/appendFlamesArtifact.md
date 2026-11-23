# src/validation/appendFlamesArtifact.ts#appendFlamesArtifact

## @evidence contracts/development/common.md#meaningful-documentation

States the structural checks, the open-fire limits and their derivation, and what each optional context, the models, the bindings or the compiled shot's light clips, adds.

## @evidence contracts/development/implementation.md#principled-implementation

Resolves each cue's node and emitter on the registered model as practical light bindings do, bounds an open fire by a positive Heskestad height and by the 0.04 m diameter at which puffing reaches the light key grid's 7.5 Hz, and requires a bound flame to share its binding's node, emitter and interval so the drawn flame and the light burn together. At the artifact boundary the binding survives only as the light clip of its id, which is what render reads the flame's luminance from, so that clip must exist.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One flame validator serves performance admission, which passes the models and bindings, and the shot artifact boundary, which passes the light clip ids, as the surface graphic validator serves both with an optional registry.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A missing size, an unbounded fire or an unresolved light is refused rather than defaulted, and a structural call invents no registry.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in cues, with one map each of staged nodes, models and bindings and a linear affordance lookup per cue.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Validation of one authored list; nothing is cached across calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Appends findings to the caller's collector and retains nothing.
