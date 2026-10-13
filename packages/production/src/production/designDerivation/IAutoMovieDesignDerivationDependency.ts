/**
 * Declared source path and normalized-source SHA-256 used in a producer basis.
 *
 * @evidence contracts/common.md#principled-implementation Capture supplies a canonical path and SHA-256 of normalized source text; canonicalBasis checks the lexical path and digest grammar.
 * @evidence contracts/common.md#clear-and-simple-design The same pair represents the emitter and each supplied dependency, keeping their source-byte normalization with capture.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Normalized source identity intentionally ignores original BOM/EOL spelling and establishes neither import reach nor authenticated provenance.
 * @evidence contracts/common.md#meaningful-documentation Defines project-relative POSIX path and normalized-source digest rather than exact original byte identity.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The pair erases; normalization/hash and dependency sorting execute in capture/canonicalBasis.
 * @evidence contracts/performance.md#reuse-equivalent-work Equal declared path/digest contributes to canonical basis identity, but current normalized bytes and complete dependency membership remain the supplying reader's responsibility.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Caller-owned basis records retain two strings per dependency/emitter without a count cap or retained source buffer/handle.
 *
 * @author Samchon
 */
export interface IAutoMovieDesignDerivationDependency {
  /** Canonical project-relative POSIX input path. */
  path: string;

  /** SHA-256 of normalized source text; original BOM/EOL byte spelling is intentionally ignored. */
  digest: string;
}
