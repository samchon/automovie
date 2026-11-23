# src/production/IAutoMovieProductionAudioProbe.ts#IAutoMovieProductionAudioProbe

## @evidence contracts/development/design.md#principled-representation

The rendered-media probe parses resident MP4 track tables, sample entry and edit list, deriving presentation runtime from movie duration and timescale and decoder priming from the single edit's media time, and carries the AAC sample entry's `esds` configuration.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Separates convenient scalar audio facts from raw integer clocks and the complete codec entry so delivery checks can compare exact timebases and codec identity without reparsing bytes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Values come from parsed bytes rather than render-manifest claims; packet count is not PCM sample count, and priming is retained instead of folded silently into presentation duration.

## @evidence contracts/development/common.md#meaningful-documentation

Defines audio class, MP4 container, seconds, channels, sample rate, packet count, priming samples and movie versus media tick domains.
