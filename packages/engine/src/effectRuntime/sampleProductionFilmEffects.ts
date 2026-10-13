import { IAutoMovieCompiledFilmEffect } from "@automovie/interface";

import { productionFrameBoundaryToSeconds } from "../film/productionFrameBoundaryToSeconds";
import { sampleCompiledEffect } from "../sampleCompiledEffect";
import { AutoMovieFilmEffectRuntimeError } from "./AutoMovieFilmEffectRuntimeError";
import { IAutoMovieFilmEffectCurrentIdentity } from "./IAutoMovieFilmEffectCurrentIdentity";
import { IAutoMovieProductionFilmEffectSample } from "./IAutoMovieProductionFilmEffectSample";
import { validateProductionFilmEffectIdentity } from "./validateProductionFilmEffectIdentity";
import { validateProductionFilmEffectRuntime } from "./validateProductionFilmEffectRuntime";

/** Sample film-owned effects at one builder-owned full-rate timeline frame. */
export const sampleProductionFilmEffects = (props: {
  identity: IAutoMovieFilmEffectCurrentIdentity;
  effects: readonly IAutoMovieCompiledFilmEffect[];
  timelineFrame: number;
  cameraDistance?: number;
}): IAutoMovieProductionFilmEffectSample[] => {
  validateProductionFilmEffectIdentity(props.identity);
  if (
    Number.isSafeInteger(props.timelineFrame) === false ||
    props.timelineFrame < 0
  )
    throw new AutoMovieFilmEffectRuntimeError(
      "film-effect-input-invalid",
      `Film effect timeline frame ${props.timelineFrame} must be a nonnegative safe integer.`,
    );
  if (
    props.cameraDistance !== undefined &&
    (Number.isFinite(props.cameraDistance) === false ||
      props.cameraDistance < 0)
  )
    throw new AutoMovieFilmEffectRuntimeError(
      "film-effect-input-invalid",
      `Film effect camera distance ${props.cameraDistance} must be finite and nonnegative.`,
    );
  return props.effects.map((runtime) => {
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
  });
};
