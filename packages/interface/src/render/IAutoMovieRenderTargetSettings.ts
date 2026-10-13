/** Renderer configuration that changes what a frame costs. */
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
