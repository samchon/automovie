import { AutoMovieContentDigest } from "../production/AutoMovieContentDigest";

/**
 * One asset the drawn frame depends on.
 *
 * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-compile-render-distinction Exposes `IAutoMovieRenderTargetAsset` as the portable data boundary for the rendering compile render distinction requirement.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-artifact-lifecycle Types `IAutoMovieRenderTargetAsset` for the spec render artifact lifecycle system contract.
 */
export interface IAutoMovieRenderTargetAsset {
  /**
   * Canonical project-relative path.
   *
   * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-compile-render-distinction Exposes `path` as the portable data boundary for the rendering compile render distinction requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-artifact-lifecycle Types `path` for the spec render artifact lifecycle system contract.
   */
  path: string;

  /**
   * SHA-256 of the exact bytes the frame will read.
   *
   * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-compile-render-distinction Exposes `digest` as the portable data boundary for the rendering compile render distinction requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-artifact-lifecycle Types `digest` for the spec render artifact lifecycle system contract.
   */
  digest: AutoMovieContentDigest;
}
