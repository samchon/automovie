# src/production/IAutoMovieProductionRoomTone.ts#IAutoMovieProductionRoomTone

## @evidence contracts/development/common.md#meaningful-documentation

States why a bed exists, how engine generates and places it, how beds meet, and every runtime refusal; each member gives its unit and range.

## @evidence contracts/development/design.md#principled-representation

A bed is a frame interval on the film clock with an RMS level in dBFS, a tilt in dB per octave of octave-band energy and a seed. Interval order, overlap, finiteness and the seed's range are runtime refusals of the mixer, because the type cannot express them.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns it; the film sound list declares beds, the sound plan carries them, and engine's `mixProductionRoomTone` reads every member.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The crossfade is not a per-bed field, because beds that meet must agree on it; it is the generator's named setting.
