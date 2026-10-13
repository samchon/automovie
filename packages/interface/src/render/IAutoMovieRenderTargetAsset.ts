
/**
 * One canonical asset path and exact byte identity in a render target dependency closure.
 *
 * @evidence contracts/common.md#principled-implementation Target construction records the supplied asset path and SHA-256 digest, sorting and rejecting duplicate paths before binding the complete dependency population into target identity.
 * @evidence contracts/common.md#clear-and-simple-design Path and byte digest are sufficient for portable dependency identity without retaining asset buffers or absolute project paths.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Digest syntax alone does not prove resident bytes; the host that acquires this closure must supply current byte-grounded facts rather than inventing an identity from a filename.
 * @evidence contracts/common.md#meaningful-documentation Defines canonical project-relative addressing and exact consumed-byte SHA-256 identity.
 * @author Samchon
 */
export interface IAutoMovieRenderTargetAsset {
  /** Canonical project-relative path. */
  path: string;

  /** SHA-256 of the exact bytes the frame will read. */
  digest: string;
}
