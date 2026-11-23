# src/sound/joinAutoMovieDialogueVisemes.ts#joinAutoMovieDialogueVisemes

## @evidence contracts/development/common.md#meaningful-documentation

The comment states the sample-to-frame rule and why it is the emission clock, that no propagation delay is added, how pauses become `sil`, and the composition with the authored expression; the props type lists the outcomes and refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The line's samples play at unit rate from its start frame's tick, so a sample's film time is the start frame plus its sample index over the model-native rate, in frames at the film rate. Frames stay fractional so the coarticulation sampler reads exact phoneme centres.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Binding and placement live here; the timing of phonemes within chunks belongs to `productionPhonemesToVisemes` and the blending to `sampleAutoMovieDialogueVisemeWeights`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Unbound, unknown or ambiguous speakers return their own `not-run` reasons instead of guessing an actor; every malformed interval and an unknown viseme throw.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the visemes and the bindings.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It returns fresh range records and holds no resource.
