/**
 * Bounded room-path result consumed by the production mix.
 *
 * @evidence contracts/common.md#principled-implementation The engine classifies outdoor, same-room and cross-room paths from explicit bindings, then uses the selected Sabine-derived response and exact input revision to produce room energy metrics or transmission amplitude gain.
 * @evidence contracts/common.md#clear-and-simple-design Available results retain profile and input identity with path-specific nullable metrics; unsupported and not-run results carry the classification and actionable reason without pretending to contain a response.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Incomplete indoor/outdoor binding is unsupported, missing analysis input is not-run, and adopted responses remain not-run until bytes are decoded and mapped; no guessed room response replaces those gaps.
 * @evidence contracts/common.md#meaningful-documentation Defines path classes, revision binding, seconds and energy versus amplitude metrics, path-dependent nulls and unavailable-response reasons.
 */
export type IAutoMovieProductionAcousticResponse =
  | {
      /** A bounded response is available. */
      status: "available";

      /** Outdoor direct path, same-room response, or cross-room transmission. */
      path: "outdoor" | "same-room" | "different-room";

      /** Selected production acoustic profile id. */
      profile: string;

      /** Digest of geometry, materials, openings, emitter, and listener input. */
      inputRevision: string;

      /** Same-room reverberation time in seconds, otherwise null. */
      reverberationTimeSeconds: number | null;

      /** Same-room direct-to-diffuse energy ratio, otherwise null. */
      directToDiffuseRatio: number | null;

      /** Different-room linear transmission gain, otherwise null. */
      transmissionGain: number | null;
    }
  | {
      /** Response could not be claimed or was not evaluated. */
      status: "unsupported" | "not-run";

      /** Path classification, or null when room binding itself was unavailable. */
      path: "outdoor" | "same-room" | "different-room" | null;

      /** Non-blank reason no response was consumed. */
      reason: string;
    };
