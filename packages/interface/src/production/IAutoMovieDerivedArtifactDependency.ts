
/**
 * One exact file consumed by a deterministic precomputation. Generator entries identify normalized TypeScript source; ordinary input entries identify their raw bytes.
 *
 * @evidence contracts/common.md#principled-implementation Canonical project path and SHA-256 pair one dependency with its observed content; generation hashes normalized source for the generator and exact raw bytes for declared inputs before sealing the basis digest.
 * @evidence contracts/common.md#clear-and-simple-design The same path-and-digest record serves the generator and input list, with their enclosing role supplying source normalization rather than duplicating byte payloads in the manifest.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A pathname or modification time cannot substitute for content identity, and changed live dependency bytes refuse publication rather than accepting the output against an earlier basis.
 * @evidence contracts/common.md#meaningful-documentation Gives canonical relative-path ownership and SHA-256 identity, distinguishing normalized generator source from raw declared-input bytes.
 * @author Samchon
 */
export interface IAutoMovieDerivedArtifactDependency {
  /** Canonical project-relative input path. */
  path: string;

  /** SHA-256 of raw input bytes, or normalized source for the generator entry. */
  digest: string;
}
