/**
 * Reflectance of one shared named skin area, independent of skin shape.
 * These are authored linear RGB gains, not melanin concentrations or clinical
 * measurements. No acquisition protocol or population calibration is claimed.
 * The licensed basis owns area membership; the document never addresses a
 * vertex, surface patch or personal coordinate. Finite nonnegative gains use
 * white as neutral, and strength zero changes nothing.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceSkinRegionAppearance {
  /** Finite nonnegative linear RGB multipliers; [1,1,1] preserves albedo. */
  gain: [number, number, number];

  /** Fraction in [0,1] of the requested gain; zero preserves albedo. */
  strength: number;
}
