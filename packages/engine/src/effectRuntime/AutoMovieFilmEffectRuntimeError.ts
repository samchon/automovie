/**
 * A refusal at the film-effect ownership and runtime boundary, carrying a
 * closed code.
 *
 * Thrown by the engine's film-effect materialization, identity, frame-rate,
 * interval, sampling and population checks, and by the render job planner
 * for a stale runtime, so a caller can classify the failure by `code` without
 * parsing `message`. The production builder does not read the code: it
 * reports any failure while materializing effects as a
 * `film-effect-cue-invalid` diagnostic carrying the message.
 *
 * @evidence contracts/common.md#principled-implementation A plain `Error` subclass with a readonly discriminant and a `name` set to the class name, the idiomatic way to give a thrown JavaScript error a stable machine-readable class while keeping its stack and message.
 * @evidence contracts/common.md#clear-and-simple-design One error type for the whole film-effect boundary with a closed code union, rather than one subclass per refusal, because callers branch on the code and nothing else differs between refusals.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No caller or code is special-cased, and the class replaces no global or built-in behavior; it only adds the `code` field to `Error`.
 * @evidence contracts/common.md#meaningful-documentation The comment states who throws it, how a caller classifies it, what each code means, and that the production builder flattens it into one diagnostic code.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Construction assigns two fields after `Error`'s own constructor, so there is no algorithm to choose.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each refusal is a distinct thrown event; sharing error instances would mix stacks and messages.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds only its code, message and stack, released with the error when the catcher drops it.
 */
export class AutoMovieFilmEffectRuntimeError extends Error {
  /**
   * Create a refusal.
   *
   * @param code Closed refusal class shared by every film-effect consumer:
   *   `film-effect-input-invalid` for a malformed argument or record,
   *   `film-effect-owner-conflict` for two cues owning one world zone over
   *   overlapping frames, `film-effect-recipe-missing` for a zone whose recipe
   *   is absent, `film-effect-runtime-invalid` for a runtime that fails its
   *   own checks, `film-effect-runtime-stale` for a runtime whose production,
   *   film, compile or edit identity differs from the current one, and
   *   `film-effect-zone-missing` for a cue naming an absent world zone.
   * @param message Human-readable explanation naming the offending record.
   */
  public constructor(
    /** Closed refusal class shared by every film-effect consumer. */
    public readonly code:
      | "film-effect-input-invalid"
      | "film-effect-owner-conflict"
      | "film-effect-recipe-missing"
      | "film-effect-runtime-invalid"
      | "film-effect-runtime-stale"
      | "film-effect-zone-missing",
    message: string,
  ) {
    super(message);
    this.name = "AutoMovieFilmEffectRuntimeError";
  }
}
