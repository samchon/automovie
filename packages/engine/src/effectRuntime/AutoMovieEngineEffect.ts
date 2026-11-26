import type {
  IAutoMovieCompiledEffect,
  IAutoMovieEffectSample,
} from "@automovie/interface";

import { sampleCompiledEffect } from "./internal/sampleCompiledEffect";

/** Deterministic sampling of compiled effect cues. */
export namespace AutoMovieEngineEffect {
  /**
   * Sample an admitted compiled cue at finite `time` in seconds on its clock.
   * The requested time determines whether the cue is active in `[start, end)`.
   * Active state follows the clock's fixed step with a 1e-9 quotient allowance.
   * It uses the cue start when the step precedes it and the requested time when
   * the rounded step reaches the exclusive end. Inactive samples contain no
   * particles and have zero intensity.
   *
   * `cameraDistance` is finite, measured in metres, and defaults to zero. Far
   * level of detail retains spawn indices divisible by four. The recipe caps
   * the number of live particles. Spawn identity depends only on the compiled
   * cue and particle index, so sampling order and worker count cannot change
   * it.
   */
  export function sample(
    effect: IAutoMovieCompiledEffect,
    time: number,
    cameraDistance?: number,
  ): IAutoMovieEffectSample {
    return sampleCompiledEffect(effect, time, cameraDistance);
  }
}
