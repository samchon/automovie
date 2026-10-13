/**
 * One declared authoring input observed by the project-owned reader.
 *
 * The builder, asset inventory and currentness projection consume the same
 * exact bytes. Source and render membership are independent because one
 * declared path can serve both roles. The source fingerprint normalizes BOM
 * and line endings; adopted asset and renderer bytes retain their exact byte
 * identity. A missing optional input remains distinct from an empty file.
 *
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
