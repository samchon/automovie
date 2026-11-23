# src/production/IAutoMovieProductionSoundAnalysis.ts#IAutoMovieProductionSoundAnalysis

## @evidence contracts/development/design.md#principled-representation

The mixer measures its 48 kHz stereo PCM for frame count, loudness, peak and near-silent spans, then searches one-frame windows around expected emission or propagated arrival for mixed-signal energy peaks.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One analysis record accompanies the exact PCM generation before encoding, keeping parser-derived encoded-media facts and the semantic sound plan separate.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Null loudness means no measurable integrated level and clippingSamples is zero by the preceding finite-PCM limiter invariant; eventAlignment cannot attribute energy to one event or prove its absence outside the searched window.

## @evidence contracts/development/common.md#meaningful-documentation

Defines the pre-encode measurement source, PCM clock and units, nullable loudness, limiter-derived clipping count and the mixed-window limitation of event alignment.
