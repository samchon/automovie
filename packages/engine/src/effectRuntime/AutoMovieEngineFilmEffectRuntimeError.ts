import type { AutoMovieFilmEffectRuntimeErrorCode } from "@automovie/interface";

/**
 * A refusal at the film-effect ownership and runtime boundary, carrying a
 * closed code.
 *
 * Thrown by the engine's film-effect materialization, identity, frame-rate,
 * interval, sampling and population checks, and by the render job planner for a
 * stale runtime, so a caller can classify the failure by `code` without parsing
 * `message`. The production builder does not read the code: it reports any
 * failure while materializing effects as a `film-effect-cue-invalid` diagnostic
 * carrying the message.
 */
export class AutoMovieEngineFilmEffectRuntimeError extends Error {
  /**
   * Create a refusal.
   *
   * @param code Closed refusal class shared by every film-effect consumer:
   *   `film-effect-input-invalid` for a malformed argument or record,
   *   `film-effect-owner-conflict` for two cues owning one world zone over
   *   overlapping frames, `film-effect-recipe-missing` for a zone whose recipe
   *   is absent, `film-effect-runtime-invalid` for a runtime that fails its own
   *   checks, `film-effect-runtime-stale` for a runtime whose production, film,
   *   compile or edit identity differs from the current one, and
   *   `film-effect-zone-missing` for a cue naming an absent world zone.
   * @param message Human-readable explanation naming the offending record.
   */
  public constructor(
    /** Closed refusal class shared by every film-effect consumer. */
    public readonly code: AutoMovieFilmEffectRuntimeErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AutoMovieFilmEffectRuntimeError";
  }
}
