/**
 * Machine-readable refusal class shared by film-effect materialization,
 * sampling and render planning.
 *
 * `film-effect-input-invalid` rejects a malformed argument or record.
 * `film-effect-owner-conflict` identifies cues owning the same world zone over
 * overlapping frames. `film-effect-recipe-missing` means a zone's recipe cannot
 * be found. `film-effect-runtime-invalid` rejects inconsistent runtime
 * contents; `film-effect-runtime-stale` distinguishes a production, film,
 * compile or edit identity mismatch. `film-effect-zone-missing` means a cue
 * names an absent world zone.
 *
 * These values classify the engine's AutoMovieEngineFilmEffectRuntimeError without
 * parsing its message. Production building reports materialization failures
 * under its separate `film-effect-cue-invalid` diagnostic code, so consumers
 * must not assume that diagnostic preserves this finer classification.
 */
export type AutoMovieFilmEffectRuntimeErrorCode =
  | "film-effect-input-invalid"
  | "film-effect-owner-conflict"
  | "film-effect-recipe-missing"
  | "film-effect-runtime-invalid"
  | "film-effect-runtime-stale"
  | "film-effect-zone-missing";
