import type { IAutoMovieCompiledFilmEffect } from "./IAutoMovieCompiledFilmEffect";
import type { IAutoMovieFilmEffectCurrentIdentity } from "./IAutoMovieFilmEffectCurrentIdentity";

/**
 * Current build identity and film frame required to sample persisted effect
 * streams.
 */
export namespace IAutoMovieSampleProductionFilmEffects {
  /**
   * Sample film-owned effects at one builder-owned full-rate timeline frame.
   *
   * Returns one sample per runtime in input order, each taken at the frame's
   * exact boundary second on that runtime's rate, with `cameraDistance` in
   * metres passed to the engine sampler (zero when omitted). Every call
   * re-validates each persisted runtime and compares it with `identity`; all
   * refusals throw `AutoMovieFilmEffectRuntimeError`:
   * `film-effect-input-invalid` for a malformed identity, a frame that is not a
   * nonnegative safe integer or a negative or non-finite distance,
   * `film-effect-runtime-invalid` for a runtime that is not what the
   * materializer writes, and `film-effect-runtime-stale` for one written under
   * a different production, film, compile or edit identity.
   */
  export type IProps = {
    /**
     * Current production, film and compile/edit fingerprints. Malformed
     * identity throws film-effect-input-invalid; disagreement with a runtime
     * throws film-effect-runtime-stale.
     */
    identity: IAutoMovieFilmEffectCurrentIdentity;
    /**
     * Borrowed persisted runtimes, sampled in input order. Every entry is
     * revalidated; returned runtime records are deep copies, so editing them
     * does not alter this array.
     */
    effects: readonly IAutoMovieCompiledFilmEffect[];
    /**
     * Nonnegative safe integer film-frame index, including frames outside an
     * effect's own interval. The underlying sampler then reports that effect
     * inactive rather than dropping the array entry.
     */
    timelineFrame: number;
    /**
     * Distance in metres passed to every effect sampler for detail selection.
     * Omitted means zero; negative or nonfinite values throw.
     */
    cameraDistance?: number;
  };
}
