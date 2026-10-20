/**
 * One canonical project-relative member of an imported model digest closure.
 *
 * @evidence contracts/common.md#principled-implementation A compiled digest binds the exact permitted model, sidecar or proxy bytes.
 * @evidence contracts/common.md#clear-and-simple-design One named contract is shared by the authoring model and its existing consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This declaration supplies no geometry, inference, fallback or runtime behavior.
 * @evidence contracts/common.md#meaningful-documentation States canonical path and compiler-sealed SHA-256 identity.
 */
export interface IAutoMovieImportedModelAsset {
  /** Canonical project-relative path. */
  path: string;

  /** SHA-256 sealed by the builder. */
  digest: string;
}
