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
 * The Cupid's bow can be measured by the angle at labiale superius between
 * the two crista-philtri peaks in 3D images
 * (https://academic.oup.com/asj/article/44/8/NP606/7658370). A separate 3D
 * study measures each peak's vertical height above the underlying labial
 * fissure; its one-year-old cohort supplies a protocol, not an adult range
 * (https://pubmed.ncbi.nlm.nih.gov/34402316/).
 * Side-specific crista-philtri–cheilion distances are another observed
 * upper-lip measure; the cited sample of Caucasian women does not provide
 * universal norms (https://pmc.ncbi.nlm.nih.gov/articles/PMC11799052/).
 * Landmark-pair fields are straight 3D distances in millimetres; peak heights
 * are vertical projections in the declared head frame. Esthetic-line fields
 * are signed point-to-line distances in the sagittal profile, and the bow
 * angle is in degrees. None is a free vermilion curve or an independent
 * tissue-section control point.
 *
 * @evidence contracts/common.md#principled-implementation Named apposed-lip distances, head-frame vertical projections, signed sagittal esthetic-line distances and the bow angle retain different acquisition quantities. The mouth observation rule compares registered measurements while unavailable landmarks/protocols remain named gaps, without direct observation-to-vertex lowering.
 * @evidence contracts/common.md#clear-and-simple-design This record owns external neutral soft-tissue measurements; dental occlusion and posed interlabial/commissure motion have separate parameter owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No free vermilion curve, independent tissue-section point, open-mouth stomion proxy or universal cohort norm substitutes for the stated acquisition.
 * @evidence contracts/common.md#meaningful-documentation Fields state landmark pairs, side, projection/distance signs and millimetres/degrees, with closed-lip and protocol-specific population limitations in the comment.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interface selects no lip interpolation, landmark measurement or target solve algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The neutral mouth record owns no request cache or repeated measurement coordination.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The declaration retains no lip mesh, acquisition image or solve task; the document owns its optional observed values.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceMouthParameters {
  /** Right-to-left cheilion, labial fissure width in mm. */
  fissureWidthMm?: number;

  /** Left crista philtri to left cheilion, straight 3D distance in mm. */
  leftCristaPhiltriToCheilionMm?: number;

  /** Right crista philtri to right cheilion, straight 3D distance in mm. */
  rightCristaPhiltriToCheilionMm?: number;

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

  /** Right crista philtri–labiale superius–left crista philtri 3D angle, degrees. */
  cupidBowCentralAngleDegrees?: number;

  /** Left crista-philtri peak vertically above its fissure crossing, mm. */
  leftCupidBowPeakHeightMm?: number;

  /** Right crista-philtri peak vertically above its fissure crossing, mm. */
  rightCupidBowPeakHeightMm?: number;

  /** Stomion to labiale inferius, lower vermilion height in mm. */
  lowerVermilionHeightMm?: number;

  /** Labiale inferius to sublabiale, lower cutaneous lip in mm. */
  lowerCutaneousLipHeightMm?: number;

  /** Labiale superius anterior to the pronasale-pogonion line, signed mm. */
  upperLipToEstheticLineMm?: number;

  /** Labiale inferius anterior to the same esthetic line, signed mm. */
  lowerLipToEstheticLineMm?: number;
}
