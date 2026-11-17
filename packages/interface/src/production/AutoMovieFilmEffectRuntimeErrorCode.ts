/**
 * Machine-readable refusal class shared by film-effect materialization, sampling and render planning.
 *
 * `film-effect-input-invalid` rejects a malformed argument or record. `film-effect-owner-conflict` identifies cues owning the same world zone over overlapping frames. `film-effect-recipe-missing` means a zone's recipe cannot be found. `film-effect-runtime-invalid` rejects inconsistent runtime contents; `film-effect-runtime-stale` distinguishes a production, film, compile or edit identity mismatch. `film-effect-zone-missing` means a cue names an absent world zone.
 *
 * These values classify the engine's AutoMovieFilmEffectRuntimeError without parsing its message. Production building reports materialization failures under its separate `film-effect-cue-invalid` diagnostic code, so consumers must not assume that diagnostic preserves this finer classification.
 *
 * @evidence contracts/development/design.md#principled-representation Six string literals preserve the existing distinct materialization, ownership, lookup, integrity and freshness refusal branches.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The engine error class and render planner share this vocabulary; exception construction, stack and instanceof identity remain in the engine.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Classification comes from the failing runtime condition and does not depend on message text or a particular production.
 * @evidence contracts/development/common.md#meaningful-documentation Explains every literal and the production diagnostic's coarser failure reporting.
 */
export type AutoMovieFilmEffectRuntimeErrorCode =
  | "film-effect-input-invalid"
  | "film-effect-owner-conflict"
  | "film-effect-recipe-missing"
  | "film-effect-runtime-invalid"
  | "film-effect-runtime-stale"
  | "film-effect-zone-missing";
