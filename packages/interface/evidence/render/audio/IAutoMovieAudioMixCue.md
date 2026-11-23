# src/render/audio/IAutoMovieAudioMixCue.ts#IAutoMovieAudioMixCue

## @evidence contracts/development/design.md#principled-representation

Content beyond the output end is dropped.

## @evidence contracts/development/design.md#minimal-and-owned-surface

mixAutoMovieAudioPcm.ICue exchanges asset, seconds, gain, pan, offsetSeconds, durationSeconds, rate; their canonical owner is this contract and their concrete meanings are documented on the members.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Defaults are pan/offset zero, rate one, and duration through the last available source sample.

## @evidence contracts/development/common.md#meaningful-documentation

One mono excerpt placed on the output sample clock. mixAutoMovieAudioPcm validates finite onset/gain/pan/rate/offset, rounds onset and explicit duration to output samples, linearly interpolates source samples, and refuses an empty or overlong excerpt. The prose and members document how mixAutoMovieAudioPcm.ICue interprets and admits these values.
