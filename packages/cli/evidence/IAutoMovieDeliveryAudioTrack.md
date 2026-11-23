# src/IAutoMovieDeliveryAudioTrack.ts#IAutoMovieDeliveryAudioTrack

## @evidence contracts/development/common.md#meaningful-documentation

Names the clock, the span and the refusal branch.

## @evidence contracts/development/design.md#principled-representation

Keeps the container's integer ticks and clock rather than seconds, so the decoder's sample count compares exactly.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Carries only the clock and presented duration the audio decode trims with.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Unknown timing is a separate reason-carrying branch, never a zero or estimated duration.
