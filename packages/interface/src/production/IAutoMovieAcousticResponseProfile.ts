
/**
 * Production-selected source of room-response data.
 *
 * The choice is either the repository's bounded broadband room analysis or an explicitly adopted external result. No solver, provider, asset, or mapping is selected by the engine. Adopted-response declares an external artifact; the pure engine response derivation reports not-run until its bytes are decoded and mapped by a consumer.
 *
 * @evidence contracts/common.md#principled-implementation The kind selects bounded Sabine broadband analysis or an explicitly identified external response; adopted byte digest, sample rate and source-listener room mappings establish the input rather than allowing provider metadata to choose a solver.
 * @evidence contracts/common.md#clear-and-simple-design Separate arms keep solver identity on derived analysis and artifact identity plus mappings on adopted data, with a shared stable profile id connecting the selected source to returned acoustic observations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The engine does not fabricate adopted impulse-response results without resident bytes; it reports not-run, and descriptive provider metadata cannot establish authoritative room mapping.
 * @evidence contracts/common.md#meaningful-documentation States production ownership of selection, the fixed analysis tier, manifest path and digest, positive sample rate, explicit room mappings and the current adopted-byte consumption gap.
 * @author Samchon
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
      digest: string;

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
