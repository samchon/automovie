/**
 * External nasal dimensions between the 3DFN surface landmarks.
 * Straight 3D millimetre distances use nasion (n), subnasale (sn), pronasale
 * (prn), alare (al), subalare (sbal) and alar curvature (ac). A photographic
 * 'projection' name here means the sn-prn distance, not a world-Z vertex
 * offset or a hand-drawn bridge profile. Curvature landmarks can be ambiguous
 * on a flat surface; source correspondence must use one stated protocol
 * (Weinberg et al., 2016, https://pmc.ncbi.nlm.nih.gov/articles/PMC4841054/;
 * Katina et al., 2016, https://onlinelibrary.wiley.com/doi/full/10.1111/joa.12407).
 * Three-dimensional nasal analysis measures the columellar-labial landmark
 * angle (https://pmc.ncbi.nlm.nih.gov/articles/PMC7060327/); another landmark
 * study defines the glabella-nasion-pronasale nasofrontal angle
 * (https://pmc.ncbi.nlm.nih.gov/articles/PMC5845526/). Separate left/right
 * nostril-aperture areas from a basal view
 * (https://pubmed.ncbi.nlm.nih.gov/19633635/).
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceNoseParameters {
  /** Nasion to subnasale, nasal height in mm. */
  heightMm?: number;
  /** Nasion to pronasale, nasal bridge length in mm. */
  bridgeLengthMm?: number;
  /** Subnasale to pronasale, 3DFN nasal protrusion distance in mm. */
  protrusionMm?: number;
  /** Right-to-left alare, nasal breadth in mm. */
  alarWidthMm?: number;
  /** Right-to-left subalare, nasal-base breadth in mm. */
  subalarWidthMm?: number;
  /** Left alar curvature to pronasale in mm. */
  leftAlaLengthMm?: number;
  /** Right alar curvature to pronasale in mm. */
  rightAlaLengthMm?: number;
  /** Glabella-nasion-pronasale nasofrontal angle, degrees. */
  nasofrontalAngleDegrees?: number;
  /** Columellar high point-subnasale-labiale superius angle, degrees. */
  columellarLabialAngleDegrees?: number;
  /** Left nostril opening area in mm² from a calibrated nasal-base view. */
  leftNostrilAreaMm2?: number;
  /** Right nostril opening area in mm² from the same calibrated view. */
  rightNostrilAreaMm2?: number;
}
