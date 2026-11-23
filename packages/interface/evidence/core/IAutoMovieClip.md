# src/core/IAutoMovieClip.ts#IAutoMovieClip

## @evidence contracts/development/design.md#principled-representation

Mirrors a glTF animation as parallel accessor tracks on one clock; `sampleClip` validates the duration and `loop` through the shared `clipDurationFault` and `clipLoopFault`, normalizes the query time by clamp or positive modulo, and samples each track through `clipTrackShapeFaults` and its interpolation mode.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A clip is only an id, a name, a clock and a track list; what a track may address is decided by the shot field that carries it, not by a clip subtype per use.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The sampler refuses duplicate canonical channelKey addresses. Artifact admission additionally requires positive duration, but its JSON-serialized channel duplicate key can miss equivalent addresses with different property ordering or pointer value-type declarations; artifact success alone therefore does not certify sampler acceptance.

## @evidence contracts/development/common.md#meaningful-documentation

States what a clip may drive and which shot fields restrict it, how it relates to Motion and `motionToClip`, the sampling clock and loop rule, the duplicate-channel throw, and the two duration rules.
