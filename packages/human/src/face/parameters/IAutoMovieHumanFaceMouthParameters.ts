/**
 * Closed-lip soft-tissue distances, separate from dental occlusion and smiles.
 * The 3D Facial Norms protocol measures the cheilion, crista philtri,
 * subnasale, labiale superius/inferius, stomion and sublabiale pairs in an
 * apposed-lip acquisition (Weinberg et al., 2016,
 * https://pmc.ncbi.nlm.nih.gov/articles/PMC4841054/, Table 2). Stomion is not
 * a single point in an open mouth; its upper and lower margins must be measured
 * separately in a posed state (Katina et al., 2016,
 * https://onlinelibrary.wiley.com/doi/full/10.1111/joa.12407).
 * Orthodontic 3D profile analysis also measures labiale superius/inferius
 * relative to the pronasale-pogonion esthetic line; it is coupled to both
 * nasal tip and chin position
 * (https://pmc.ncbi.nlm.nih.gov/articles/PMC9571629/).
 * All fields are straight 3D distances in millimetres, not free vermilion
 * curves or independent tissue-section control points.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceMouthParameters {
  /** Right-to-left cheilion, labial fissure width in mm. */
  fissureWidthMm?: number;
  /** Right-to-left crista philtri, philtrum width in mm. */
  philtrumWidthMm?: number;
  /** Subnasale to labiale superius, philtrum length in mm. */
  philtrumLengthMm?: number;
  /** Subnasale to stomion, entire upper-lip height in mm. */
  upperLipHeightMm?: number;
  /** Stomion to sublabiale, entire lower-lip height in mm. */
  lowerLipHeightMm?: number;
  /** Labiale superius to stomion, upper vermilion height in mm. */
  upperVermilionHeightMm?: number;
  /** Stomion to labiale inferius, lower vermilion height in mm. */
  lowerVermilionHeightMm?: number;
  /** Labiale inferius to sublabiale, lower cutaneous lip in mm. */
  lowerCutaneousLipHeightMm?: number;
  /** Labiale superius anterior to the pronasale-pogonion line, signed mm. */
  upperLipToEstheticLineMm?: number;
  /** Labiale inferius anterior to the same esthetic line, signed mm. */
  lowerLipToEstheticLineMm?: number;
}
