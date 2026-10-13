/**
 * Admitted raster, shadow and beauty-color configuration that changes render cost and target identity.
 *
 * @evidence contracts/common.md#principled-implementation Target sealing validates positive raster dimensions, finite positive pixel ratio and exposure and consistent shadow enable/filter state; inventory prices the same normalized renderer shadow policy.
 * @evidence contracts/common.md#clear-and-simple-design A compact configuration record isolates frame-affecting settings from renderer identity and exact asset bytes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Shadows false requires none rather than a contradictory filter, and unsupported host shadow aliases are normalized by the shared policy rather than counted under a different render path.
 * @evidence contracts/common.md#meaningful-documentation Defines pixel units, positive ratios/exposure, shadow master switch and filter family and beauty tone mapping.
 * @author Samchon
 */
export interface IAutoMovieRenderTargetSettings {
  /** Drawing-buffer width in pixels, a positive integer. */
  width: number;

  /** Drawing-buffer height in pixels, a positive integer. */
  height: number;

  /**
   * Device pixel ratio applied to the drawing buffer, finite and above zero.
   */
  pixelRatio: number;

  /** Whether shadow maps are rendered at all. */
  shadows: boolean;

  /** Deterministic shadow-filter family, or `none` when shadows are off. */
  shadowType: "none" | "pcf" | "pcfSoft" | "vsm";

  /** Beauty-pass tone-mapping curve. */
  toneMapping: "none" | "acesFilmic";

  /** Renderer exposure multiplier, finite and above zero. */
  exposure: number;
}
