/** Deterministic conversion from declared WAVE layout/clock to mixer input. */
export interface IAutoMovieProductionAudioProcessing {
  /** Exact conversion stages applied in source order. */
  kind: "copy" | "downmix" | "resample" | "downmix-resample";
  /** Mixer-facing mono channel count. */
  outputChannels: 1;
  /** Mixer-facing sample clock after conversion. */
  outputSampleRate: number;
  /** Output-by-input downmix coefficients. */
  matrix: readonly (readonly number[])[];
}
