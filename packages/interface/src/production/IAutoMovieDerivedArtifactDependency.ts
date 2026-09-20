import type { AutoMovieContentDigest } from "./AutoMovieContentDigest";

/**
 * One exact file consumed by a deterministic precomputation.
 *
 * @evidence requirements/agent-authoring/deterministic-precomputation.md#agent-precomputed-closed-basis Makes every declared input byte part of the product-owned basis.
 * @evidence specifications/authoring-and-authority/deterministic-precomputed-artifacts.md#spec-authoring-precomputed-basis Types one canonical member of the ordered digest closure.
 * @author Samchon
 */
export interface IAutoMovieDerivedArtifactDependency {
  /**
   * Canonical project-relative input path.
   *
   * @evidence requirements/agent-authoring/deterministic-precomputation.md#agent-precomputed-closed-basis Identifies which declared project input the generator consumed.
   * @evidence specifications/authoring-and-authority/deterministic-precomputed-artifacts.md#spec-authoring-precomputed-basis Supplies the stable role of one input digest.
   * @evidence specifications/authoring-and-authority/deterministic-precomputed-artifacts.md#spec-authoring-precomputed-portability Restricts dependency identity to one canonical project-relative spelling across hosts.
   */
  path: string;

  /**
   * SHA-256 of the exact input bytes.
   *
   * @evidence requirements/agent-authoring/deterministic-precomputation.md#agent-precomputed-closed-basis Makes a changed input stale without a manually bumped revision.
   * @evidence specifications/authoring-and-authority/deterministic-precomputed-artifacts.md#spec-authoring-precomputed-basis Seals one exact input payload into the basis closure.
   */
  digest: AutoMovieContentDigest;
}
