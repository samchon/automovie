/**
 * Reflectance of one shared named skin area, independent of skin shape.
 * These are authored linear RGB gains, not melanin concentrations or clinical
 * measurements. No acquisition protocol or population calibration is claimed.
 * The licensed basis owns area membership; the document never addresses a
 * vertex, surface patch or personal coordinate. Finite nonnegative gains use
 * white as neutral, and strength zero changes nothing.
 *
 * @evidence contracts/common.md#principled-implementation createHumanFaceSkinRegionGains composes each named area's RGB multiplier as 1+strength*(gain-1) on registered continuous-skin vertices in lexical area order before existing albedo admission.
 * @evidence contracts/common.md#clear-and-simple-design Complete gain and independent strength separate regional appearance from source area membership and skin geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown or nonresident/non-skin areas refuse even at zero strength; finite nonnegative gains have no invented scalar upper bound, while downstream albedo capacity still applies and source resolution limits boundary smoothness.
 * @evidence contracts/common.md#meaningful-documentation Linear RGB, white identity and zero strength describe optical gains rather than pigment concentrations or clinical measurements.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The record performs no gain-buffer expansion or triangle shading.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Shared area membership is source data, not pigmentation caching here.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Four caller scalars create no skin colour arrays or textures.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceSkinRegionAppearance {
  /** Finite nonnegative linear RGB multipliers; [1,1,1] preserves albedo. */
  gain: [number, number, number];

  /** Fraction in [0,1] of the requested gain; zero preserves albedo. */
  strength: number;
}
