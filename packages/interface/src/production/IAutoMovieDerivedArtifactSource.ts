import type { AutoMovieContentDigest } from "./AutoMovieContentDigest";
import { AutoMovieDerivedArtifactEncoding } from "./AutoMovieDerivedArtifactEncoding";

/**
 * One current derived artifact projected into deterministic source context.
 *
 * @evidence requirements/agent-authoring/deterministic-precomputation.md#agent-precomputed-compile-refusal Exposes only bytes whose live basis and output digest passed compile-time verification.
 * @evidence specifications/authoring-and-authority/deterministic-precomputed-artifacts.md#spec-authoring-precomputed-freshness Defines the exact JSON-safe source-context projection.
 * @author Samchon
 */
export interface IAutoMovieDerivedArtifactSource {
  /**
   * Current output digest verified before context publication.
   *
   * @evidence requirements/agent-authoring/deterministic-precomputation.md#agent-precomputed-compile-refusal Lets source and downstream diagnostics retain the verified byte identity.
   * @evidence specifications/authoring-and-authority/deterministic-precomputed-artifacts.md#spec-authoring-precomputed-freshness Carries the checked output identity with its content.
   */
  digest: AutoMovieContentDigest;
  /**
   * Whether content is direct UTF-8 text or base64 of raw bytes.
   *
   * @evidence requirements/agent-authoring/deterministic-precomputation.md#agent-precomputed-derived-artifact Gives ordinary source a stable interpretation without a giant literal.
   * @evidence specifications/authoring-and-authority/deterministic-precomputed-artifacts.md#spec-authoring-precomputed-freshness Preserves arbitrary exact bytes across the sandbox JSON boundary.
   */
  encoding: AutoMovieDerivedArtifactEncoding;
  /**
   * Verified text or base64 payload.
   *
   * @evidence requirements/agent-authoring/deterministic-precomputation.md#agent-precomputed-derived-artifact Supplies the precomputed result to authored source.
   * @evidence specifications/authoring-and-authority/deterministic-precomputed-artifacts.md#spec-authoring-precomputed-freshness Publishes content only after every freshness gate succeeds.
   */
  content: string;
}
