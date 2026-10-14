

/**
 * Captured path, exact digest and byte count of one retained publication payload.
 *
 * @evidence contracts/common.md#principled-implementation Path addresses one admitted publication member and digest/length identify the current bytes observed before commit; no file existence flag replaces byte identity.
 * @evidence contracts/common.md#clear-and-simple-design The snapshot producer creates entries and the currentness verifier consumes them inside render-bundle publication.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An entry is not proof that physical publication completed or that the path is safe; the project reader and publication authority own those facts.
 * @evidence contracts/common.md#meaningful-documentation States publication-relative addressing, exact bytes and captured length.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The record type executes no file read or SHA-256 operation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Input byte identity is comparison data, not a cached successful publication result.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only path/digest strings and a count survive capture, retaining no payload bytes or filesystem handles.
 */
export interface IProductionPayloadSnapshotEntry {
  /** Canonical publication-relative path. */
  path: string;
  /** Digest of the exact captured bytes. */
  digest: string;
  /** Exact captured byte length. */
  bytes: number;
}
