/**
 * Scene-wide policy for physical-light shadow maps in beauty passes.
 */
export interface IAutoMovieSceneShadows {
  /** Whether shadow maps are rendered in beauty passes. */
  enabled: boolean;

  /**
   * Effective filters are PCF and VSM. The legacy pcfSoft spelling is a PCF
   * alias. VSM is supported for directional and spot shadows; enabled
   * shadow-casting point lights with VSM are refused before rendering.
   */
  type: "pcf" | "pcfSoft" | "vsm";
}
