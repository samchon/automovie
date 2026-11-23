# src/production/sound/IAutoMovieRenderProductionSound.ts#IAutoMovieRenderProductionSound.IProps

## @evidence contracts/development/design.md#principled-representation

Plan events/cues/dialogue use film frames; rational boundaries round once to the 48000 Hz sample clock. The mixer assumes the plan's declared stereo/48000 Hz contract and validates cue trims plus supplied referenced PCM.

## @evidence contracts/development/design.md#minimal-and-owned-surface

renderProductionSound consumes adopted decoded mono buffers through id maps and returns a fresh stereo master plus analysis; decoding, IO and asset provenance remain host responsibilities.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Missing cue assets intentionally select procedural bus stand-ins while missing dialogue omits that line. These are distinct fallbacks; empty/nonfinite supplied buffers throw instead of triggering them.

## @evidence contracts/development/common.md#meaningful-documentation

Sound-plan arithmetic inputs and optional adopted mono PCM generations. Plan events/cues/dialogue use film frames; rational boundaries round once to the 48000 Hz sample clock. The mixer assumes the plan's declared stereo/48000 Hz contract and validates cue trims plus supplied referenced PCM.
