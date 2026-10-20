import { IAutoMovieCompiledFilmEffect } from "@automovie/interface";

import { IAutoMovieEffectSample } from "../IAutoMovieEffectSample";

/**
 * One film-owned effect and its deterministic engine sample at one timeline
 * frame.
 *
 * `sampleProductionFilmEffects` returns one per input runtime, in input order,
 * after the runtime passed validation and matched the current identity. The
 * sample is taken at the frame's exact boundary second on the runtime's own
 * reduced rate, so an effect whose interval excludes that frame still yields
 * an entry whose sample is inactive.
 *
 * @evidence contracts/common.md#principled-implementation Pairs a validated runtime with the result of `sampleCompiledEffect` at `frame * denominator / numerator` seconds, the same exact boundary time the materializer used for the stream's `start` and `end`, so frame ownership and sampling agree.
 * @evidence contracts/common.md#clear-and-simple-design Keeps the runtime beside its sample so a viewer can draw the particles and still name the cue, zone and identity they came from without a second lookup by index.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Inactive effects are not filtered out, so the result length always equals the input population and a consumer cannot mistake a dropped stale entry for an idle one.
 * @evidence contracts/common.md#meaningful-documentation States the producer, the one-per-input order, that validation and identity matching precede it, the exact sampling time, and that an out-of-interval frame still yields an inactive entry.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A data shape; the per-runtime digest recomputation and particle sampling are answered on `sampleProductionFilmEffects`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Built fresh for each sampled frame; no sample is cached because the frame and camera distance are inputs of every particle position.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources `runtime` is a deep clone the caller owns, so mutating it never edits the persisted array, and `sample` is a new record; nothing else references either.
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
