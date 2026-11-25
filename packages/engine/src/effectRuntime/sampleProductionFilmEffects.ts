import {
  IAutoMovieCompiledFilmEffect,
  type IAutoMovieProductionFilmEffectSample,
  type IAutoMovieSampleProductionFilmEffects,
} from "@automovie/interface";

import { productionFrameBoundaryToSeconds } from "../film/productionFrameBoundaryToSeconds";
import { sampleCompiledEffect } from "../sampleCompiledEffect";
import { AutoMovieFilmEffectRuntimeError } from "./AutoMovieFilmEffectRuntimeError";
import { validateProductionFilmEffectIdentity } from "./validateProductionFilmEffectIdentity";
import { validateProductionFilmEffectRuntime } from "./validateProductionFilmEffectRuntime";

/**
 * Sample film-owned effects at one builder-owned full-rate timeline frame.
 *
 * Returns one sample per runtime in input order, each taken at the frame's
 * exact boundary second on that runtime's rate, with `cameraDistance` in metres
 * passed to the engine sampler (zero when omitted). Every call re-validates
 * each persisted runtime and compares it with `identity`; all refusals throw
 * `AutoMovieFilmEffectRuntimeError`: `film-effect-input-invalid` for a
 * malformed identity, a frame that is not a nonnegative safe integer or a
 * negative or non-finite distance, `film-effect-runtime-invalid` for a runtime
 * that is not what the materializer writes, and `film-effect-runtime-stale` for
 * one written under a different production, film, compile or edit identity.
 */
export const sampleProductionFilmEffects = (
  props: IAutoMovieSampleProductionFilmEffects.IProps,
): IAutoMovieProductionFilmEffectSample[] => {
  validateProductionFilmEffectIdentity(props.identity);
  if (props.timelineFrame < 0)
    throw new AutoMovieFilmEffectRuntimeError(
      "film-effect-input-invalid",
      `Film effect timeline frame ${props.timelineFrame} must be a nonnegative safe integer.`,
    );
  if (props.cameraDistance !== undefined && props.cameraDistance < 0)
    throw new AutoMovieFilmEffectRuntimeError(
      "film-effect-input-invalid",
      `Film effect camera distance ${props.cameraDistance} must be finite and nonnegative.`,
    );
  return props.effects.map(
    (
      runtime: IAutoMovieCompiledFilmEffect,
    ): IAutoMovieProductionFilmEffectSample => {
      validateProductionFilmEffectRuntime(runtime);
      if (
        runtime.production !== props.identity.production ||
        runtime.film !== props.identity.film ||
        runtime.compileFingerprint !== props.identity.compileFingerprint ||
        runtime.editFingerprint !== props.identity.editFingerprint
      )
        throw new AutoMovieFilmEffectRuntimeError(
          "film-effect-runtime-stale",
          `Film effect runtime "${runtime.effect.id}" differs from the current production, film, compile, or edit identity.`,
        );
      return {
        runtime: structuredClone(runtime),
        sample: sampleCompiledEffect(
          runtime.effect,
          productionFrameBoundaryToSeconds({
            frame: props.timelineFrame,
            frameRate: runtime.frameRate,
          }),
          props.cameraDistance,
        ),
      };
    },
  );
};
