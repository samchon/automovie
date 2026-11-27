import type { IAutoMovieCompiledFilmEffect } from "./IAutoMovieCompiledFilmEffect";
import type { IAutoMovieFilmTimeline } from "./IAutoMovieFilmTimeline";

/**
 * Inputs for checking a persisted effect population against its current film
 * timeline.
 */
export namespace IAutoMovieVerifyProductionFilmEffectPopulation {
  /**
   * Borrowed timeline and persisted runtime entries for an exact population
   * check.
   *
   * Per-entry identity checks cannot see an entry that is absent, so an empty
   * or truncated runtime array would otherwise read as current. The population
   * must match the canonically ordered cue set one to one, every entry must
   * pass `validateProductionFilmEffectRuntime`, and every entry must carry the
   * timeline's film id, `inputFingerprint`, edit fingerprint and reduced frame
   * rate together with its cue's id, zone, frame interval and intensity. The
   * timeline does not name its production, so the `production` field is left to
   * the sampler's identity comparison. An inconsistent timeline clock throws
   * `film-effect-input-invalid`; every population mismatch throws
   * `film-effect-runtime-invalid`.
   */
  export type IProps = {
    /**
     * Current film timeline; its effect cues, input fingerprint, edit and
     * reduced frame rate define the expected runtime population. The verifier
     * reads without changing or retaining it.
     */
    timeline: IAutoMovieFilmTimeline;

    /**
     * Complete runtime population ordered by cue start frame then UTF-16
     * code-unit cue ID. Empty is valid only for an empty timeline effect track.
     * The verifier does not sort or mutate this borrowed array.
     */
    effects: readonly IAutoMovieCompiledFilmEffect[];
  };
}
