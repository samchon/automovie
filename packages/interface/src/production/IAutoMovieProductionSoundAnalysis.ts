/** Parser-independent evidence calculated from the final mixed PCM. */
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

  /** Per-event energy evidence centered on the authoritative event frame. */
  eventAlignment: Array<{
    /** Stable sound occurrence id. */
    id: string;

    /** Exact expected event time. */
    expectedSeconds: number;

    /** Peak-energy sample time inside the event gate. */
    peakSeconds: number;

    /** Absolute frame-clock error. */
    errorFrames: number;

    /** Whether observable energy lands within one production frame. */
    passed: boolean;
  }>;
}
