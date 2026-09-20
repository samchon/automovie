/**
 * RGBA evidence raster before a package-owned PNG encoder serializes it.
 *
 * @evidence requirements/sound/validation-and-delivery.md#sound-numeric-verification Projects exact sample measurements into deterministic review evidence.
 * @evidence specifications/simulation-effects-and-sound/validation-evidence-and-compatibility.md#sound-budget-and-audible-review Defines the renderer-neutral raster supplied to audible review tooling.
 */
export interface IAutoMovieProductionSoundRaster {
  /**
   * Raster width in pixels.
   *
   * @evidence requirements/sound/validation-and-delivery.md#sound-numeric-verification Retains an exact evidence-image dimension.
   * @evidence specifications/simulation-effects-and-sound/validation-evidence-and-compatibility.md#sound-budget-and-audible-review Makes the numeric evidence raster self-describing.
   */
  width: number;
  /**
   * Raster height in pixels.
   *
   * @evidence requirements/sound/validation-and-delivery.md#sound-numeric-verification Retains an exact evidence-image dimension.
   * @evidence specifications/simulation-effects-and-sound/validation-evidence-and-compatibility.md#sound-budget-and-audible-review Makes the numeric evidence raster self-describing.
   */
  height: number;
  /**
   * Row-major RGBA bytes for the exact evidence image.
   *
   * @evidence requirements/sound/validation-and-delivery.md#sound-numeric-verification Preserves deterministic visualized PCM measurements.
   * @evidence specifications/simulation-effects-and-sound/validation-evidence-and-compatibility.md#sound-budget-and-audible-review Carries the computed evidence pixels without a package-specific encoder.
   */
  rgba: Uint8Array;
}
