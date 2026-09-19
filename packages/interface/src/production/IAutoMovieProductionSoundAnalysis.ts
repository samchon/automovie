/**
 * Parser-independent evidence calculated from the final mixed PCM.
 *
 * @evidence requirements/sound/validation-and-delivery.md#sound-budget-evidence Exposes `IAutoMovieProductionSoundAnalysis` as the portable data boundary for the sound budget evidence requirement.
 * @evidence specifications/simulation-effects-and-sound/validation-evidence-and-compatibility.md#sound-budget-and-audible-review Types `IAutoMovieProductionSoundAnalysis` for the sound budget and audible review system contract.
 */
export interface IAutoMovieProductionSoundAnalysis {
  /**
   * Analysis schema.
   *
   * @evidence requirements/sound/validation-and-delivery.md#sound-budget-evidence Exposes `version` as the portable data boundary for the sound budget evidence requirement.
   * @evidence specifications/simulation-effects-and-sound/validation-evidence-and-compatibility.md#sound-budget-and-audible-review Types `version` for the sound budget and audible review system contract.
   */
  version: 1;

  /**
   * Fixed output PCM clock.
   *
   * @evidence requirements/sound/validation-and-delivery.md#sound-budget-evidence Exposes `sampleRate` as the portable data boundary for the sound budget evidence requirement.
   * @evidence specifications/simulation-effects-and-sound/validation-evidence-and-compatibility.md#sound-budget-and-audible-review Types `sampleRate` for the sound budget and audible review system contract.
   */
  sampleRate: 48_000;

  /**
   * Exact interleaved stereo frame count.
   *
   * @evidence requirements/sound/validation-and-delivery.md#sound-budget-evidence Exposes `sampleFrames` as the portable data boundary for the sound budget evidence requirement.
   * @evidence specifications/simulation-effects-and-sound/validation-evidence-and-compatibility.md#sound-budget-and-audible-review Types `sampleFrames` for the sound budget and audible review system contract.
   */
  sampleFrames: number;

  /**
   * Runtime derived from the PCM clock.
   *
   * @evidence requirements/sound/validation-and-delivery.md#sound-budget-evidence Exposes `runtimeSeconds` as the portable data boundary for the sound budget evidence requirement.
   * @evidence specifications/simulation-effects-and-sound/validation-evidence-and-compatibility.md#sound-budget-and-audible-review Types `runtimeSeconds` for the sound budget and audible review system contract.
   */
  runtimeSeconds: number;

  /**
   * ITU-R BS.1770 K-weighted, gated integrated loudness in LUFS.
   *
   * @evidence requirements/sound/validation-and-delivery.md#sound-budget-evidence Exposes `integratedLoudness` as the portable data boundary for the sound budget evidence requirement.
   * @evidence specifications/simulation-effects-and-sound/validation-evidence-and-compatibility.md#sound-budget-and-audible-review Types `integratedLoudness` for the sound budget and audible review system contract.
   */
  integratedLoudness: number | null;

  /**
   * Absolute post-limiter sample peak.
   *
   * @evidence requirements/sound/validation-and-delivery.md#sound-budget-evidence Exposes `samplePeak` as the portable data boundary for the sound budget evidence requirement.
   * @evidence specifications/simulation-effects-and-sound/validation-evidence-and-compatibility.md#sound-budget-and-audible-review Types `samplePeak` for the sound budget and audible review system contract.
   */
  samplePeak: number;

  /**
   * Number of post-limiter samples outside [-1, 1].
   *
   * @evidence requirements/sound/validation-and-delivery.md#sound-budget-evidence Exposes `clippingSamples` as the portable data boundary for the sound budget evidence requirement.
   * @evidence specifications/simulation-effects-and-sound/validation-evidence-and-compatibility.md#sound-budget-and-audible-review Types `clippingSamples` for the sound budget and audible review system contract.
   */
  clippingSamples: number;

  /**
   * Longest contiguous near-silent span.
   *
   * @evidence requirements/sound/validation-and-delivery.md#sound-budget-evidence Exposes `longestSilenceSeconds` as the portable data boundary for the sound budget evidence requirement.
   * @evidence specifications/simulation-effects-and-sound/validation-evidence-and-compatibility.md#sound-budget-and-audible-review Types `longestSilenceSeconds` for the sound budget and audible review system contract.
   */
  longestSilenceSeconds: number;

  /**
   * Per-event energy evidence centered on the authoritative event frame.
   *
   * @evidence requirements/sound/validation-and-delivery.md#sound-budget-evidence Exposes `eventAlignment` as the portable data boundary for the sound budget evidence requirement.
   * @evidence specifications/simulation-effects-and-sound/validation-evidence-and-compatibility.md#sound-budget-and-audible-review Types `eventAlignment` for the sound budget and audible review system contract.
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

    /** Whether observable energy lands within one production frame. */
    passed: boolean;
  }>;
}
