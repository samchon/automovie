
/**
 * One canonical asset path and exact byte identity in a render target dependency closure.
 *
 * @evidence contracts/common.md#principled-implementation Target construction records the supplied asset path and SHA-256 digest, sorting and rejecting duplicate paths before binding the complete dependency population into target identity.
 * @evidence contracts/common.md#clear-and-simple-design Path and byte digest are sufficient for portable dependency identity without retaining asset buffers or absolute project paths.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Sealing checks a nonblank unique path and lowercase sha256: digest spelling; it does not canonicalize paths, read bytes or prove a complete dependency closure. The acquiring caller supplies canonical paths and current byte-grounded facts, and shared asset records must remain unchanged while their sealed digest is reused.
 * @evidence contracts/common.md#meaningful-documentation Defines canonical project-relative addressing and exact consumed-byte SHA-256 identity.
 * @author Samchon
 */
export interface IAutoMovieRenderTargetAsset {
  /** Canonical project-relative path supplied by the caller; sealing only checks that the exact string is nonblank and unique. */
  path: string;

  /** SHA-256 of the exact bytes the frame will read. */
  digest: string;
}
