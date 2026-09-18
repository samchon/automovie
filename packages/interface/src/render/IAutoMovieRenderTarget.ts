import { AutoMovieContentDigest } from "../production/AutoMovieContentDigest";
import { IAutoMovieRenderTargetAsset } from "./IAutoMovieRenderTargetAsset";
import { IAutoMovieRenderTargetRenderer } from "./IAutoMovieRenderTargetRenderer";
import { IAutoMovieRenderTargetSettings } from "./IAutoMovieRenderTargetSettings";

/**
 * The exact renderer, settings, and asset bytes a render report was measured
 * against.
 *
 * A budget verdict is only evidence while the thing it measured is still the
 * thing that will be drawn. Change the shadow filter, the pixel ratio, or one
 * texture's bytes and the same design costs something else, so a report that
 * outlives its target is not conservative, it is wrong in an unknown direction.
 * The fingerprint makes that detectable: a consumer compares the report's
 * target against the target in front of it and treats a mismatch as stale
 * rather than as a pass.
 *
 * Everything here is deterministic and platform-independent by construction. No
 * timestamps, no absolute paths, no locale-dependent ordering: two machines
 * that will draw the same frame produce byte-identical fingerprints.
 *
 * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-compile-render-distinction Exposes `IAutoMovieRenderTarget` as the portable data boundary for the rendering compile render distinction requirement.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-artifact-lifecycle Types `IAutoMovieRenderTarget` for the spec render artifact lifecycle system contract.
 * @author Samchon
 */
export interface IAutoMovieRenderTarget {
  /**
   * Versioned fingerprint protocol.
   *
   * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-compile-render-distinction Exposes `protocol` as the portable data boundary for the rendering compile render distinction requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-artifact-lifecycle Types `protocol` for the spec render artifact lifecycle system contract.
   */
  protocol: "automovie.render-target.v1";

  /**
   * Who draws the frame.
   *
   * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-compile-render-distinction Exposes `renderer` as the portable data boundary for the rendering compile render distinction requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-artifact-lifecycle Types `renderer` for the spec render artifact lifecycle system contract.
   */
  renderer: IAutoMovieRenderTargetRenderer;

  /**
   * Renderer configuration that changes what a frame costs.
   *
   * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-compile-render-distinction Exposes `settings` as the portable data boundary for the rendering compile render distinction requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-artifact-lifecycle Types `settings` for the spec render artifact lifecycle system contract.
   */
  settings: IAutoMovieRenderTargetSettings;

  /**
   * Every asset whose bytes the drawn frame depends on, ascending by path.
   *
   * Ordering is by UTF-16 code unit, never by locale collation, so a Turkish or
   * Swedish host does not fingerprint a different frame than an English one.
   *
   * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-compile-render-distinction Exposes `assets` as the portable data boundary for the rendering compile render distinction requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-artifact-lifecycle Types `assets` for the spec render artifact lifecycle system contract.
   */
  assets: IAutoMovieRenderTargetAsset[];

  /**
   * Digest over the protocol and every field above.
   *
   * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-compile-render-distinction Exposes `digest` as the portable data boundary for the rendering compile render distinction requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-artifact-lifecycle Types `digest` for the spec render artifact lifecycle system contract.
   */
  digest: AutoMovieContentDigest;
}
