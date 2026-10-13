import { IAutoMovieCompiledFilmEffect } from "@automovie/interface";

import { IAutoMovieEffectSample } from "../IAutoMovieEffectSample";

/**
 * One film-owned effect and its deterministic engine sample.
 *
 * @author Samchon
 */
export interface IAutoMovieProductionFilmEffectSample {
  /** Persisted film-owned runtime identity. */
  runtime: IAutoMovieCompiledFilmEffect;
  /** Existing engine sample at the requested full-rate frame. */
  sample: IAutoMovieEffectSample;
}
