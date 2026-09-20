import { AutoMovieContentDigest } from "./AutoMovieContentDigest";

/**
 * Bounded room-path result consumed by the production mix.
 *
 * @evidence requirements/sound/interior-acoustics.md#sound-acoustic-mix-consumption Separates outdoor propagation, same-room response, and cross-room transmission.
 * @evidence specifications/simulation-effects-and-sound/ambience-music-spatial-and-acoustics.md#acoustic-mix-consumption-and-claim-boundary Preserves unavailable analysis as unsupported or not-run rather than an invented effect.
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
      inputRevision: AutoMovieContentDigest;

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
