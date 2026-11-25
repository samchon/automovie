# src/analysis/IAutoMovieAnalyzeAcoustics.ts#IAutoMovieAnalyzeAcoustics.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Solve one room for reverberation, equipment noise and partition performance. Member documentation states the supplied records, units and absence meanings used by analyzeAutoMovieAcoustics.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Only the acoustic request is exposed; unsupported speech-intelligibility and degenerate diffuse-field results remain explicit gaps, not additional guessed inputs.

## @evidence contracts/development/design.md#principled-representation

request reuses IAutoMovieAcousticRequest for room geometry, absorption, sources and receivers; analyzeAutoMovieAcoustics admits it before producing seconds, sound levels and transmission metrics.

## @evidence contracts/development/design.md#minimal-and-owned-surface

interface owns IAutoMovieAnalyzeAcoustics.IProps, used by analyzeAutoMovieAcoustics. Its request members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
