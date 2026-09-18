import { AutoMovieContentDigest } from "./AutoMovieContentDigest";

/**
 * Production-selected source of room-response data.
 *
 * The choice is either the repository's bounded broadband room analysis or an
 * explicitly adopted external result. No solver, provider, asset, or mapping is
 * selected by the engine.
 *
 * @evidence requirements/sound/interior-acoustics.md#sound-acoustic-provider-neutrality Keeps derived and externally adopted response sources equally expressible.
 * @evidence specifications/simulation-effects-and-sound/ambience-music-spatial-and-acoustics.md#bounded-acoustic-response-and-provider-adoption Carries the user's response-source choice and adopted-byte identity.
 */
export type IAutoMovieAcousticResponseProfile =
  | {
      /** Use the shared bounded room analysis. */
      kind: "derived-room-analysis";

      /** Stable profile identity within the production. */
      id: string;

      /** Closed calculation tier shared with architectural analysis. */
      solver: "sabine-broadband-v1";
    }
  | {
      /** Use a response artifact the production adopted. */
      kind: "adopted-response";

      /** Stable profile identity within the production. */
      id: string;

      /** Manifest-owned response asset path. */
      asset: string;

      /** Digest of the exact adopted bytes. */
      digest: AutoMovieContentDigest;

      /** Positive sample rate of an impulse-response asset. */
      sampleRate: number;

      /** Explicit source-room and listener-room mapping identities. */
      roomMappings: Array<{
        /** Source interior-space id. */
        source: string;

        /** Listener interior-space id. */
        listener: string;

        /** Stable response member inside the adopted asset. */
        response: string;
      }>;

      /** Optional provider metadata retained as provenance, never authority. */
      provider?: {
        /** External provider name retained from the adoption receipt. */
        name: string;

        /** Optional provider model identity. */
        model?: string;

        /** Optional provider model or service revision. */
        version?: string;
      };
    };
