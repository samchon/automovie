# src/production/IAutoMovieProductionSoundAnalysis.ts#IAutoMovieProductionSoundAnalysis

## @evidence contracts/development/design.md#principled-representation

The mixer and the master stage measure their 48 kHz stereo PCM for frame count, BS.1770-5 integrated loudness and true peak, sample peak, samples outside [−1, 1] and near-silent spans, then searches one-frame windows around expected emission or propagated arrival for mixed-signal energy peaks.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One analysis record accompanies the exact PCM generation before encoding, keeping parser-derived encoded-media facts and the semantic sound plan separate.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Null loudness means no block passed the absolute gate, null true peak means digital silence, and clippingSamples counts the samples it measures rather than assuming a limiter, because an unmastered mix may clip; version 2 marks these fields; eventAlignment cannot attribute energy to one event or prove its absence outside the searched window.

## @evidence contracts/development/common.md#meaningful-documentation

Defines the pre-encode measurement source, PCM clock and units, nullable loudness and true peak, the counted clipping and the mixed-window limitation of event alignment.
