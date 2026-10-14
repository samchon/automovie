/**
 * One declared authoring input observed by the project-owned reader.
 *
 * The builder, asset inventory and currentness projection consume the same
 * exact bytes. Source and render membership are independent because one
 * declared path can serve both roles. The source fingerprint normalizes BOM
 * and line endings; adopted asset and renderer bytes retain their exact byte
 * identity. A missing optional input remains distinct from an empty file.
 *
 * @evidence contracts/common.md#principled-implementation One observed pathname and exact optional bytes feed both compiler identity and asset admission; independent source and render flags preserve their distinct normalization and membership contracts.
 * @evidence contracts/common.md#clear-and-simple-design The project reader owns path admission and byte observation, while fingerprinting and asset inventory consume this same carrier without rereading a different revision.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Null distinguishes an absent optional input from empty bytes, and source normalization never rewrites adopted render bytes.
 * @evidence contracts/common.md#meaningful-documentation States path scope, both membership flags, source normalization and null-byte meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interface supplies already observed data; filesystem walks, byte reads and fingerprint hashing are costed on their owners.
 * @evidence contracts/performance.md#reuse-equivalent-work The builder passes one observed inventory to content fingerprinting and asset admission, so both judge the same bytes within one attempt; a fresh attempt observes a new inventory.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The compilation owns the input array and byte buffers until its attempt ends; its declared content population and total file bytes determine retention, with no fixed size bound declared here.
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
