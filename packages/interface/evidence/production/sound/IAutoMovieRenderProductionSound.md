# src/production/sound/IAutoMovieRenderProductionSound.ts#IAutoMovieRenderProductionSound

## @evidence contracts/development/common.md#meaningful-documentation

Sound-plan arithmetic inputs and optional adopted mono PCM generations. Plan events/cues/dialogue use film frames; rational boundaries round once to the 48000 Hz sample clock. The mixer assumes the plan's declared stereo/48000 Hz contract and validates cue trims plus supplied referenced PCM. Dialogue arrives at the plan rate, plays at unit rate from its start tick and is levelled to the dialogue target of the optional loudness intent, or EBU R 128 without one; the result is the unmastered mix.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Missing cue assets intentionally select procedural bus stand-ins while missing dialogue omits that line. These are distinct fallbacks; empty/nonfinite supplied buffers throw instead of triggering them, and a line longer than its speech span throws instead of being fitted to it. The film sound route reads every cue asset, so it never reaches the stand-in.

## @evidence contracts/development/design.md#principled-representation

Plan events/cues/dialogue use film frames; rational boundaries round once to the 48000 Hz sample clock. The mixer assumes the plan's declared stereo/48000 Hz contract and validates cue trims plus supplied referenced PCM.

## @evidence contracts/development/design.md#minimal-and-owned-surface

renderProductionSound consumes adopted decoded mono buffers through id maps and returns a fresh stereo mix, its analysis and its loudness record; the optional `loudness` intent is read by the line leveller and carried to `masterProductionSound`; decoding, IO and asset provenance remain host responsibilities.

# src/production/sound/IAutoMovieRenderProductionSound.ts#IAutoMovieRenderProductionSound.IProps

## @evidence contracts/development/design.md#principled-representation

Plan events/cues/dialogue use film frames; rational boundaries round once to the 48000 Hz sample clock. The mixer assumes the plan's declared stereo/48000 Hz contract and validates cue trims plus supplied referenced PCM.

## @evidence contracts/development/design.md#minimal-and-owned-surface

renderProductionSound consumes adopted decoded mono buffers through id maps and returns a fresh stereo mix, its analysis and its loudness record; the optional `loudness` intent is read by the line leveller and carried to `masterProductionSound`; decoding, IO and asset provenance remain host responsibilities.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Missing cue assets intentionally select procedural bus stand-ins while missing dialogue omits that line. These are distinct fallbacks; empty/nonfinite supplied buffers throw instead of triggering them. A line outside the ±12 dB levelling range throws rather than being mixed at a level it was not measured to have.

## @evidence contracts/development/common.md#meaningful-documentation

Sound-plan arithmetic inputs and optional adopted mono PCM generations. Plan events/cues/dialogue use film frames; rational boundaries round once to the 48000 Hz sample clock. The mixer assumes the plan's declared stereo/48000 Hz contract and validates cue trims plus supplied referenced PCM.
