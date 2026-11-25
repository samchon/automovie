/**
 * Binding and emission-timing metadata for supplied dialogue visemes.
 *
 * Composition names the intended mouth layer over authored expression at
 * emission time. The join helper returns metadata and ranges; it neither
 * verifies actor existence nor applies expression, and currently has only test
 * callers. Audio propagation delay is separate from this emission clock.
 */
export type IAutoMovieProductionLipSyncJoin =
  | {
      /**
       * Binding and timing are available; this status does not prove actor
       * application.
       */
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
