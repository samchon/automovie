/**
 * One declared authoring input observed by the project-owned reader.
 *
 * The builder, asset inventory and currentness projection consume the same
 * exact bytes. Source and render membership are independent because one
 * declared path can serve both roles. The source fingerprint normalizes BOM
 * and line endings; adopted asset and renderer bytes retain their exact byte
 * identity. A missing optional input remains distinct from an empty file.
 *
 * @evidence requirements/agent-authoring/source-owned-loop.md#agent-source-result-link Carries the exact bytes and declared roles from which compile input identity and later freshness checks are derived.
 * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input Represents an observed project-relative source or adopted-content input without introducing a machine location into its identity.
 * @author Samchon
 */
export interface IAutoMovieProductionContentInput {
  /** Project-relative normalized path. */
  path: string;

  /** Whether source BOM and line-ending normalization applies to its identity. */
  source: boolean;

  /** Whether contentRoots or contentFiles declares this as a render input. */
  render: boolean;

  /** Exact bytes, or null when an explicitly optional input is absent. */
  bytes: Uint8Array | null;
}
