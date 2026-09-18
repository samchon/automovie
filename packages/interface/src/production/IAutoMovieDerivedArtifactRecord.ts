import type { AutoMovieContentDigest } from "./AutoMovieContentDigest";
import { AutoMovieDerivedArtifactEncoding } from "./AutoMovieDerivedArtifactEncoding";
import { IAutoMovieDerivedArtifactDependency } from "./IAutoMovieDerivedArtifactDependency";

/**
 * Tracked identity of one explicitly generated deterministic artifact.
 *
 * @evidence requirements/agent-authoring/deterministic-precomputation.md#agent-precomputed-derived-artifact Replaces giant source literals with reviewable project-owned derived bytes.
 * @evidence specifications/authoring-and-authority/deterministic-precomputed-artifacts.md#spec-authoring-precomputed-manifest Carries the separate manifest record the builder verifies.
 * @author Samchon
 */
export interface IAutoMovieDerivedArtifactRecord {
  /**
   * Canonical output path below `automovie/derived/`.
   *
   * @evidence requirements/agent-authoring/deterministic-precomputation.md#agent-precomputed-provenance-separation Gives deterministic derivation a namespace external assets cannot own.
   * @evidence specifications/authoring-and-authority/deterministic-precomputed-artifacts.md#spec-authoring-precomputed-manifest Locates the exact resident output independently from the external asset ledger.
   * @evidence specifications/authoring-and-authority/deterministic-precomputed-artifacts.md#spec-authoring-precomputed-portability Carries the canonical project-relative output identity the physical publication gate enforces.
   */
  path: string;
  /**
   * Source-context representation of the exact output bytes.
   *
   * @evidence requirements/agent-authoring/deterministic-precomputation.md#agent-precomputed-derived-artifact Lets source consume text or binary results without embedding them in TypeScript.
   * @evidence specifications/authoring-and-authority/deterministic-precomputed-artifacts.md#spec-authoring-precomputed-freshness Declares how verified bytes cross the JSON sandbox boundary.
   */
  encoding: AutoMovieDerivedArtifactEncoding;
  /**
   * Generator source identity and normalized-source digest.
   *
   * @evidence requirements/agent-authoring/deterministic-precomputation.md#agent-precomputed-closed-basis Makes the generator itself an input rather than a remembered revision number.
   * @evidence specifications/authoring-and-authority/deterministic-precomputed-artifacts.md#spec-authoring-precomputed-basis Seals normalized generator source into the basis.
   */
  generator: IAutoMovieDerivedArtifactDependency;
  /**
   * Declared input files sorted by canonical path.
   *
   * @evidence requirements/agent-authoring/deterministic-precomputation.md#agent-precomputed-closed-basis Exposes the complete declared input set for review and freshness checks.
   * @evidence specifications/authoring-and-authority/deterministic-precomputed-artifacts.md#spec-authoring-precomputed-basis Keeps input ordering portable and rejects duplicate identities.
   */
  inputs: IAutoMovieDerivedArtifactDependency[];
  /**
   * Domain-separated digest of generator and declared input identities.
   *
   * @evidence requirements/agent-authoring/deterministic-precomputation.md#agent-precomputed-closed-basis Gives compile one product-owned live-versus-recorded basis comparison.
   * @evidence specifications/authoring-and-authority/deterministic-precomputed-artifacts.md#spec-authoring-precomputed-basis Identifies the complete versioned dependency closure.
   */
  basisDigest: AutoMovieContentDigest;
  /**
   * SHA-256 of the exact artifact bytes.
   *
   * @evidence requirements/agent-authoring/deterministic-precomputation.md#agent-precomputed-compile-refusal Detects edited, partial, or stale output before source can consume it.
   * @evidence specifications/authoring-and-authority/deterministic-precomputed-artifacts.md#spec-authoring-precomputed-freshness Pins the resident output independently from its basis.
   */
  outputDigest: AutoMovieContentDigest;
}
