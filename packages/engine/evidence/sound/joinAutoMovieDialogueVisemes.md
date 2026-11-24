# src/sound/joinAutoMovieDialogueVisemes.ts#joinAutoMovieDialogueVisemes

## @evidence contracts/development/common.md#meaningful-documentation

The comment states the sample-to-frame rule and why it is the emission clock, that no propagation delay is added, how pauses become `sil`, and the composition with the authored expression; the props type lists the outcomes and refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The mix places the line's decoded samples at unit rate from its start frame's nearest sample tick, and the speech span ends on the first frame whose nearest tick holds them all (productionSpeechEndFrame). A source bound scaled by the decoded count over the source count is that same decoded offset, within half a sample of the exact rate ratio, and reading it between nearest-tick frame boundaries puts it on the span's own clock, so the receipt's last bound ends on the span's end frame instead of a hair past it, as 13 979 samples at 22.05 kHz in a 30000/1001 fps film did. Frames stay fractional so the coarticulation sampler reads exact phoneme centres.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Binding and placement live here; the timing of phonemes within chunks belongs to `productionPhonemesToVisemes` and the blending to `sampleAutoMovieDialogueVisemeWeights`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Unbound, unknown or ambiguous speakers return their own `not-run` reasons instead of guessing an actor; every malformed interval and an unknown viseme throw.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the visemes and the bindings; each bound costs at most three exact tick computations.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It returns fresh range records and holds no resource.
