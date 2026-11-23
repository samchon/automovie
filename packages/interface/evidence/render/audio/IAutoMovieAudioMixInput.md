# src/render/audio/IAutoMovieAudioMixInput.ts#IAutoMovieAudioMixInput

## @evidence contracts/development/design.md#principled-representation

Source buffers are borrowed and never mutated; no cue yields silent output.

## @evidence contracts/development/design.md#minimal-and-owned-surface

mixAutoMovieAudioPcm exchanges sampleRate, frames, sources, cues, master, fadeSeconds; their canonical owner is this contract and their concrete meanings are documented on the members.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Source buffers are borrowed and never mutated; no cue yields silent output.

## @evidence contracts/development/common.md#meaningful-documentation

Mono source buffers and placements for a deterministic stereo mix. mixAutoMovieAudioPcm validates positive integral output rate/length, source availability and cue bounds, and rejects nonfinite audible samples or a summed peak above one. The prose and members document how mixAutoMovieAudioPcm interprets and admits these values.
