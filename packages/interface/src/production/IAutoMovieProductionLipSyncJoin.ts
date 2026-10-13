/**
 * Actor join for visemes derived from one final dialogue receipt.
 *
 * Mouth motion layers over authored expression at emission time; audio propagation delay affects listener arrival separately.
 *
 * @evidence contracts/common.md#principled-implementation joinAutoMovieDialogueVisemes resolves exactly one explicit speaker binding and validates final-byte frame ranges before producing an emission-timed mouth layer; absent or ambiguous joins return a closed not-run reason.
 * @evidence contracts/common.md#clear-and-simple-design The union separates usable actor composition metadata from a missing-join fact, leaving the viseme timeline and actual expression sampling in their own records.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Speaker identity is not guessed from cast order, external audio receives no fabricated phonemes, and mouth motion is not shifted to delayed listener arrival.
 * @evidence contracts/common.md#meaningful-documentation Defines explicit actor resolution, emission clock, mouth-only composition and the three unavailable-binding reasons.
 * @author Samchon
 */
export type IAutoMovieProductionLipSyncJoin =
  | {
      /** Lip-sync can be applied. */
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
