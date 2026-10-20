/**
 * Measurements calculated from the final limited, pre-encode mixed PCM; event windows observe combined energy rather than isolating individual emitters.
 *
 * @evidence contracts/common.md#principled-implementation The mixer measures its 48 kHz stereo PCM for frame count, loudness, peak and near-silent spans, then searches one-frame windows around expected emission or propagated arrival for mixed-signal energy peaks.
 * @evidence contracts/common.md#clear-and-simple-design One analysis record accompanies the exact PCM generation before encoding, keeping parser-derived encoded-media facts and the semantic sound plan separate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Null loudness means no measurable integrated level and clippingSamples is zero by the preceding finite-PCM limiter invariant; eventAlignment cannot attribute energy to one event or prove its absence outside the searched window.
 * @evidence contracts/common.md#meaningful-documentation Defines the pre-encode measurement source, PCM clock and units, nullable loudness, limiter-derived clipping count and the mixed-window limitation of event alignment.
 */
export interface IAutoMovieProductionSoundAnalysis {
  /** Analysis schema. */
  version: 1;

  /** Fixed output PCM clock. */
  sampleRate: 48_000;

  /** Exact interleaved stereo frame count. */
  sampleFrames: number;

  /** Runtime derived from the PCM clock. */
  runtimeSeconds: number;

  /** ITU-R BS.1770 K-weighted, gated integrated loudness in LUFS. */
  integratedLoudness: number | null;

  /** Absolute post-limiter sample peak. */
  samplePeak: number;

  /** Number of post-limiter samples outside [-1, 1]. */
  clippingSamples: number;

  /** Longest contiguous near-silent span. */
  longestSilenceSeconds: number;

  /** Combined-mix energy measurements within one frame of each expected emission or arrival; unrelated sound can contribute. */
  eventAlignment: Array<{
    /** Stable sound occurrence id. */
    id: string;

    /** Exact expected event time. */
    expectedSeconds: number;

    /** Peak-energy sample time inside the event gate. */
    peakSeconds: number;

    /** Absolute frame-clock error. */
    errorFrames: number;

    /** Whether the searched mixed-signal window has observable energy and its selected peak is within one frame; not an isolated-event proof. */
    passed: boolean;
  }>;
}
