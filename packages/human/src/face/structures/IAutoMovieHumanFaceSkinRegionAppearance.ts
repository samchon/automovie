/**
 * Reflectance of one shared named skin area, independent of skin shape.
 * These are authored linear RGB gains, not melanin concentrations or clinical
 * measurements. No acquisition protocol or population calibration is claimed.
 * The licensed basis owns area membership; the document never addresses a
 * vertex, surface patch or personal coordinate. Finite nonnegative gains use
 * white as neutral, and strength zero changes nothing.
 *
 * @evidence contracts/common.md#principled-implementation One RGB gain and its independent strength describe reflectance without introducing positional authoring.
 * @evidence contracts/common.md#clear-and-simple-design The same value type serves every shared anatomical area.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No individual topology or clinical measurement is inferred from an authored colour.
 * @evidence contracts/common.md#meaningful-documentation States units, neutral, ownership and unknown scientific calibration.
 * @evidence contracts/modeling.md#parameter-channels Strength interpolates from white to the supplied gain; it changes reflectance only.
 * @evidence contracts/modeling.md#spatial-conventions Gains and strength are dimensionless linear RGB values.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record describes existing skin rather than a new part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The registered skin area owns membership.
 * @evidenceExclude contracts/modeling.md#rendered-observation The connected skin builder observes appearance.
 * @evidence contracts/anatomy.md#anatomical-source No measured biological quantity is asserted; pigment concentration and acquisition protocol remain unknown.
 * @evidenceExclude contracts/anatomy.md#permitted-range Appearance admission is numerical rather than physiological.
 * @evidence contracts/anatomy.md#parametric-authority Only reflectance and strength are person-authored; shared area membership cannot be edited here.
 * @author Samchon
 */
export interface IAutoMovieHumanFaceSkinRegionAppearance {
  /** Finite nonnegative linear RGB multipliers; [1,1,1] preserves albedo. */
  gain: [number, number, number];

  /** Fraction in [0,1] of the requested gain; zero preserves albedo. */
  strength: number;
}
