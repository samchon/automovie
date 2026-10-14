import { AutoMovieDerivedArtifactEncoding } from "./AutoMovieDerivedArtifactEncoding";

/**
 * One current derived artifact projected into deterministic source context.
 *
 * @evidence contracts/common.md#principled-implementation Only an artifact whose manifest, live dependency basis and output digest are current is projected into source context; encoding maps verified bytes to direct UTF-8 text or lossless base64.
 * @evidence contracts/common.md#clear-and-simple-design Source context receives digest, encoding and payload as an explicit verified input value; this record grants no filesystem or generator API, while ordinary Node module execution retains ambient host capabilities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Artifact admission refuses missing or stale precomputation instead of regenerating it. This coordinator behavior does not sandbox authored source effects, and binary payloads cannot use lossy text decoding under a UTF-8 declaration.
 * @evidence contracts/common.md#meaningful-documentation Defines verified current-output identity, the two encoding meanings and the payload's ownership as already-admitted source-context input.
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
