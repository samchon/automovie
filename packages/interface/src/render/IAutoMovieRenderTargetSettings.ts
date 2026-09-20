/**
 * Renderer configuration that changes what a frame costs.
 *
 * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-compile-render-distinction Exposes `IAutoMovieRenderTargetSettings` as the portable data boundary for the rendering compile render distinction requirement.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-artifact-lifecycle Types `IAutoMovieRenderTargetSettings` for the spec render artifact lifecycle system contract.
 */
export interface IAutoMovieRenderTargetSettings {
  /**
   * Drawing-buffer width in pixels, a positive integer.
   *
   * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-compile-render-distinction Exposes `width` as the portable data boundary for the rendering compile render distinction requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-artifact-lifecycle Types `width` for the spec render artifact lifecycle system contract.
   */
  width: number;

  /**
   * Drawing-buffer height in pixels, a positive integer.
   *
   * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-compile-render-distinction Exposes `height` as the portable data boundary for the rendering compile render distinction requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-artifact-lifecycle Types `height` for the spec render artifact lifecycle system contract.
   */
  height: number;

  /**
   * Device pixel ratio applied to the drawing buffer, finite and above zero.
   *
   * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-compile-render-distinction Exposes `pixelRatio` as the portable data boundary for the rendering compile render distinction requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-artifact-lifecycle Types `pixelRatio` for the spec render artifact lifecycle system contract.
   */
  pixelRatio: number;

  /**
   * Whether shadow maps are rendered at all.
   *
   * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-compile-render-distinction Exposes `shadows` as the portable data boundary for the rendering compile render distinction requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-artifact-lifecycle Types `shadows` for the spec render artifact lifecycle system contract.
   */
  shadows: boolean;

  /**
   * Deterministic shadow-filter family, or `none` when shadows are off.
   *
   * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-compile-render-distinction Exposes `shadowType` as the portable data boundary for the rendering compile render distinction requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-artifact-lifecycle Types `shadowType` for the spec render artifact lifecycle system contract.
   */
  shadowType: "none" | "pcf" | "pcfSoft" | "vsm";

  /**
   * Beauty-pass tone-mapping curve.
   *
   * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-compile-render-distinction Exposes `toneMapping` as the portable data boundary for the rendering compile render distinction requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-artifact-lifecycle Types `toneMapping` for the spec render artifact lifecycle system contract.
   */
  toneMapping: "none" | "acesFilmic";

  /**
   * Renderer exposure multiplier, finite and above zero.
   *
   * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-compile-render-distinction Exposes `exposure` as the portable data boundary for the rendering compile render distinction requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-artifact-lifecycle Types `exposure` for the spec render artifact lifecycle system contract.
   */
  exposure: number;
}
