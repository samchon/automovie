/**
 * Actor join for visemes derived from one final dialogue receipt.
 *
 * Mouth motion stays on emission time. It layers only the mouth target over
 * authored expression and does not move to delayed listener-arrival time.
 *
 * @evidence requirements/sound/dialogue-voice-and-visemes.md#sound-lipsync-join Joins final-byte visemes to the speaking actor without hand-authored syllable keys.
 * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#dialogue-lipsync-join-and-seek Makes emission-time mouth layering explicit and seek-stable.
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
