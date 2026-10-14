import { AutoMovieDerivedArtifactEncoding } from "./AutoMovieDerivedArtifactEncoding";

/**
 * One current derived artifact projected into deterministic source context.
 *
 * @evidence contracts/common.md#principled-implementation A host supplies digest, encoding and payload through ShotBuildContext. The production artifact inspector/decoder is retired; current-byte verification and faithful encoding remain host premises rather than checks performed by this record. UTF-8 text and base64 bytes have distinct transport meanings and a declared digest does not independently verify either payload.
 * @evidence contracts/common.md#clear-and-simple-design Source context receives an explicit host-prepared value without a filesystem or generator API; arbitrary subject code still has its ordinary ambient capabilities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No surviving coordinator automatically regenerates or refuses stale artifacts through this type. Hosts must preserve binary payloads with base64 rather than lossy text decoding and verify the bytes they declare; the context is no sandbox.
 * @evidence contracts/common.md#meaningful-documentation Defines intended current-output identity, the two encoding meanings and host ownership of payload preparation and verification.
 * @author Samchon
 */
export interface IAutoMovieDerivedArtifactSource {
  /** Current output digest verified before context publication. */
  digest: string;

  /** Whether content is direct UTF-8 text or base64 of raw bytes. */
  encoding: AutoMovieDerivedArtifactEncoding;

  /** Verified text or base64 payload. */
  content: string;
}
