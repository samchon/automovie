# src/production/IAutoMovieProductionSoundCue.ts#IAutoMovieProductionSoundCue

## @evidence contracts/development/design.md#principled-representation

The normalized cue maps a unit-rate source trim and fade spans onto the film frame clock, retaining asset identity, gain and bus; the mixer checks declared frame bounds and reads finite supplied samples within the trim, but does not prove that sourceDurationFrames matches decoded byte duration.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Keeps reusable source extent distinct from selected duration and source offset; decoded PCM remains a caller-supplied input rather than a codec or filesystem responsibility inside deterministic mixing.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Missing decoded assets currently use the documented procedural bus stand-in, so this plan alone does not prove adopted-asset playback; source-overflow, invalid spans and non-finite supplied samples refuse.

## @evidence contracts/development/common.md#meaningful-documentation

Defines exact asset and cue identity, global frame placement, unit-rate trim ceiling, fades, gain, bus and procedural seed, including the missing-buffer stand-in limitation.
