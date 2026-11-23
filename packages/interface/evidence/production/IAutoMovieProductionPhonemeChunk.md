# src/production/IAutoMovieProductionPhonemeChunk.ts#IAutoMovieProductionPhonemeChunk

## @evidence contracts/development/design.md#principled-representation

The supplied receipt preserves phoneme text and a half-open native-sample interval; productionPhonemesToVisemes maps admitted chunk fractions to authored film-frame bins. This conversion does not establish synthesis provenance or independently measured phoneme onset.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Keeps native sample timing beside phoneme text rather than prematurely rounding every phoneme to a production frame or duplicating synthesized PCM.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

These are model stream chunks, not independently measured phoneme onset timestamps; bounded frame binning may group several tokens into one mouth target.

## @evidence contracts/development/common.md#meaningful-documentation

Defines synthesis order and inclusive-start exclusive-end offsets on the model-native PCM sample clock.
