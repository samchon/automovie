/**
 * Measurements calculated from the final limited, pre-encode mixed PCM; event
 * windows observe combined energy rather than isolating individual emitters.
 */
export interface IAutoMovieProductionSoundAnalysis {
  /**
   * Analysis schema; version 2 adds `truePeakDbtp` and counts
   * `clippingSamples`.
   */
  version: 2;

  /** Fixed output PCM clock. */
  sampleRate: 48_000;

  /** Exact interleaved stereo frame count. */
  sampleFrames: number;

  /** Runtime derived from the PCM clock. */
  runtimeSeconds: number;

  /**
   * ITU-R BS.1770-5 K-weighted, gated integrated loudness in LUFS, measured by
   * engine's `createLoudnessMeter`; null when no block passes the −70
   * LUFS absolute gate.
   */
  integratedLoudness: number | null;

  /**
   * ITU-R BS.1770-5 Annex 2 true peak from 4× oversampling, in dBTP; null for
   * digital silence.
   */
  truePeakDbtp: number | null;

  /** Absolute post-limiter sample peak. */
  samplePeak: number;

  /** Number of post-limiter samples outside [-1, 1]. */
  clippingSamples: number;

  /** Longest contiguous near-silent span. */
  longestSilenceSeconds: number;

  /**
   * Combined-mix energy measurements within one frame of each expected emission
   * or arrival; unrelated sound can contribute.
   */
  eventAlignment: Array<{
    /** Stable sound occurrence id. */
    id: string;

    /** Exact expected event time. */
    expectedSeconds: number;

    /** Peak-energy sample time inside the event gate. */
    peakSeconds: number;

    /** Absolute frame-clock error. */
    errorFrames: number;

    /**
     * Whether the searched mixed-signal window has observable energy and its
     * selected peak is within one frame; not an isolated-event proof.
     */
    passed: boolean;
  }>;
}
