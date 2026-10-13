import { IAutoMovieCompiledFilmEffect } from "@automovie/interface";

import { productionFrameBoundaryToSeconds } from "../film/productionFrameBoundaryToSeconds";
import { sampleCompiledEffect } from "../sampleCompiledEffect";
import { AutoMovieFilmEffectRuntimeError } from "./AutoMovieFilmEffectRuntimeError";
import { IAutoMovieFilmEffectCurrentIdentity } from "./IAutoMovieFilmEffectCurrentIdentity";
import { IAutoMovieProductionFilmEffectSample } from "./IAutoMovieProductionFilmEffectSample";
import { validateProductionFilmEffectIdentity } from "./validateProductionFilmEffectIdentity";
import { validateProductionFilmEffectRuntime } from "./validateProductionFilmEffectRuntime";

/**
 * Sample film-owned effects at one builder-owned full-rate timeline frame.
 *
 * Returns one sample per runtime in input order, each taken at the frame's
 * exact boundary second on that runtime's rate, with `cameraDistance` in metres
 * passed to the engine sampler (zero when omitted). Every call re-validates
 * each persisted runtime and compares it with `identity`; all refusals throw
 * `AutoMovieFilmEffectRuntimeError`: `film-effect-input-invalid` for a malformed
 * identity, a frame that is not a nonnegative safe integer or a negative or
 * non-finite distance, `film-effect-runtime-invalid` for a runtime that is not
 * what the materializer writes, and `film-effect-runtime-stale` for one written
 * under a different production, film, compile or edit identity.
 *
 * @evidence contracts/common.md#principled-implementation Trust is decided at read time: each runtime's shape and both content digests are recomputed by `validateProductionFilmEffectRuntime`, then its four identity fields are compared by exact equality with the caller's independently derived identity, and only then is `sampleCompiledEffect` run at `frame * denominator / numerator` seconds, the boundary the materializer used for the stream window.
 * @evidence contracts/common.md#clear-and-simple-design The function owns only the read-side gate and the frame-to-second conversion; shape validation, identity validation and particle sampling are each delegated to the one engine function that owns them, so preview and capture call a single entry point.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A stale or malformed runtime throws instead of being skipped, so a consumer cannot render a partial population as if it were current, and the identity is never read from the runtimes themselves.
 * @evidence contracts/common.md#meaningful-documentation States the output order, the sampling time, the unit and default of `cameraDistance`, that validation repeats on every call, and each refusal code with its cause.
 * @evidence contracts/performance.md#efficient-algorithms For N runtimes the cost is `O(N)` validations, each two SHA-256 digests over the runtime's canonical JSON, plus one deep clone and one particle sample per runtime; the digests dominate and are repeated per sampled frame because the runtime objects are caller-owned and mutable.
 * @evidence contracts/performance.md#reuse-equivalent-work Validation results are deliberately not cached between frames: the persisted runtimes are mutable records with no version token, so object identity cannot prove a runtime is unchanged since its last check, and a caller sampling many frames pays the digests each time.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains nothing between calls; the returned samples own deep clones of their runtimes, so the result's size is linear in the population and is released with the caller's array.
 */
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
