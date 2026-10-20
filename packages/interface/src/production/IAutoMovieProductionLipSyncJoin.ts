/**
 * Binding and emission-timing metadata for supplied dialogue visemes.
 *
 * Composition names the intended mouth layer over authored expression at emission time. The join helper returns metadata and ranges; it neither verifies actor existence nor applies expression, and currently has only test callers. Audio propagation delay is separate from this emission clock.
 *
 * @evidence contracts/common.md#principled-implementation joinAutoMovieDialogueVisemes selects exactly one supplied speaker binding and validates ordered line/viseme frame ranges, inserting rest gaps. It returns actor and composition metadata; final-byte provenance and actual actor existence remain caller premises.
 * @evidence contracts/common.md#clear-and-simple-design The union separates usable actor composition metadata from a missing-join fact, leaving the viseme timeline and actual expression sampling in their own records.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Speaker identity is not guessed from cast order, external audio receives no fabricated phonemes, and mouth motion is not shifted to delayed listener arrival.
 * @evidence contracts/common.md#meaningful-documentation Defines explicit supplied-binding selection, emission clock, intended mouth composition, unavailable-binding reasons and current actor-application/host limits.
 */
export type IAutoMovieProductionLipSyncJoin =
  | {
      /** Binding and timing are available; this status does not prove actor application. */
      status: "available";

      /** Actor id resolved from the authored speaker. */
      actor: string;

      /** Mouth movement follows visual emission, not delayed audio arrival. */
      timing: "emission";

      /** Preserve authored emotion outside the mouth target. */
      composition: "mouth-layer-over-authored-expression";
    }
  | {
      /** Lip-sync could not be joined. */
      status: "not-run";

      /** Exact missing or ambiguous join fact. */
      reason:
        | "speaker-not-declared"
        | "speaker-actor-not-found"
        | "speaker-actor-ambiguous";
    };
