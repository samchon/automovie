/**
 * One canonical project-relative member of an imported model digest closure.
 *
 * @evidence contracts/development/design.md#principled-representation A compiled digest binds the exact permitted model, sidecar or proxy bytes.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One named contract is shared by the authoring model and its existing consumers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This declaration supplies no geometry, inference, fallback or runtime behavior.
 * @evidence contracts/development/common.md#meaningful-documentation States canonical path and compiler-sealed SHA-256 identity.
 */
export interface IAutoMovieImportedModelAsset {
  /** Canonical project-relative path. */
  path: string;

  /** SHA-256 sealed by the builder. */
  digest: string;
}
