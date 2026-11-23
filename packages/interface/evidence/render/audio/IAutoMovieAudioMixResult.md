# src/render/audio/IAutoMovieAudioMixResult.ts#IAutoMovieAudioMixResult

## @evidence contracts/development/design.md#principled-representation

Both channels have the requested sample-frame count; peak is the largest absolute stored sample over both channels in [0, 1].

## @evidence contracts/development/design.md#minimal-and-owned-surface

mixAutoMovieAudioPcm exchanges left, right, peak; their canonical owner is this contract and their concrete meanings are documented on the members.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Both channels have the requested sample-frame count; peak is the largest absolute stored sample over both channels in [0, 1].

## @evidence contracts/development/common.md#meaningful-documentation

Owned stereo Float32 channels returned by mixAutoMovieAudioPcm after clipping admission. The prose and members document how mixAutoMovieAudioPcm interprets and admits these values.
