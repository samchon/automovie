import { IAutoMovieClip, IAutoMovieLight } from "@automovie/interface";

/**
 * What {@link resolveShotLighting} evaluates: the staged lights and the clips
 * changing them.
 *
 * @evidence requirements/lighting/sources-and-photometry.md#lighting-source-time-sampling Defines the authored source state sampled at one shot instant.
 * @evidence specifications/camera-light-and-visibility/light-source-photometry-and-environment.md#clv-source-sampling-refusal Defines the input boundary for deterministic source sampling.
 * @author Samchon
 */
export interface IAutoMovieShotLightingInput {
  /**
   * The scene's staged lights, in staging order.
   *
   * @evidence requirements/lighting/sources-and-photometry.md#lighting-source-time-sampling Supplies the authored light sources whose state is sampled at the requested time.
   * @evidence specifications/camera-light-and-visibility/light-source-photometry-and-environment.md#clv-source-sampling-refusal Preserves the staged source inventory during temporal evaluation.
   */
  lights: readonly IAutoMovieLight[];

  /**
   * The shot's light-motion clips (`IAutoMovieShot.lightMotions`).
   *
   * @evidence requirements/lighting/sources-and-photometry.md#lighting-source-time-sampling Supplies the authored time-varying channels evaluated for each light source.
   * @evidence specifications/camera-light-and-visibility/light-source-photometry-and-environment.md#clv-source-sampling-refusal Carries authored source-animation records into deterministic sampling.
   */
  clips: readonly IAutoMovieClip[];

  /**
   * The instant to evaluate, in shot-local seconds.
   *
   * @evidence requirements/lighting/sources-and-photometry.md#lighting-source-time-sampling Selects the exact shot-local instant at which every light source is evaluated.
   * @evidence specifications/camera-light-and-visibility/light-source-photometry-and-environment.md#clv-source-sampling-refusal Provides the common sample time for deterministic light state.
   */
  seconds: number;
}
