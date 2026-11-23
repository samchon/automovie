import type { IAutoMovieCompiledFilmEffect } from "../IAutoMovieCompiledFilmEffect";
import type { IAutoMovieEffectSample } from "../IAutoMovieEffectSample";

/**
 * One film-owned effect and its deterministic engine sample at one timeline
 * frame.
 *
 * `sampleProductionFilmEffects` returns one per input runtime, in input order,
 * after the runtime passed validation and matched the current identity. The
 * sample is taken at the frame's exact boundary second on the runtime's own
 * reduced rate, so an effect whose interval excludes that frame still yields an
 * entry whose sample is inactive.
 */
export interface IAutoMovieProductionFilmEffectSample {
  /** Deep copy of the validated, current persisted runtime that was sampled. */
  runtime: IAutoMovieCompiledFilmEffect;

  /**
   * Engine sample of the runtime's stream at the requested full-rate timeline
   * frame; inactive with no particles when the frame lies outside the cue.
   */
  sample: IAutoMovieEffectSample;
}
