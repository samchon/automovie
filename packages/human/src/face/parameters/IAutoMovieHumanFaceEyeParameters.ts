/**
 * External palpebral and internal optical measurements of both eyes.
 * The 3DFN study measures the canthal distances and each en-ex fissure length
 * on 3D surface photographs (Weinberg et al., 2016,
 * https://pmc.ncbi.nlm.nih.gov/articles/PMC4841054/, Table 2). A separate 3D
 * periocular study defines fissure height at the pupil and upper crease height
 * relative to the upper margin (https://pmc.ncbi.nlm.nih.gov/articles/PMC11588936/).
 * Horizontal visible iris diameter is the nasal-to-temporal limbus or
 * white-to-white extent, not the diameter of the pigmented iris texture
 * (https://pmc.ncbi.nlm.nih.gov/articles/PMC8284630/). Globe axial length is
 * an internal biometric measurement, not observable from the same facial
 * photograph (https://pubmed.ncbi.nlm.nih.gov/20363029/).
 * Corneal radius and central thickness likewise require ocular biometry
 * (https://pubmed.ncbi.nlm.nih.gov/11906297/).
 * Eye appearance, gaze and eyelid motion have different owners.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceEyeParameters {
  /** Right-to-left endocanthion distance, in mm. */
  innerCanthalDistanceMm?: number;
  /** Right-to-left exocanthion distance, in mm. */
  outerCanthalDistanceMm?: number;
  /** Right-to-left pupil-centre distance in forward gaze, in mm. */
  interpupillaryDistanceMm?: number;
  /** Anatomical left aperture and globe. */
  left?: IAutoMovieHumanFaceEyeParameters.Side;
  /** Anatomical right aperture and globe. */
  right?: IAutoMovieHumanFaceEyeParameters.Side;
}

export namespace IAutoMovieHumanFaceEyeParameters {
  /**
   * One eye's surface apertures and separately observed internal optics.
   * @author Samchon
   */
  export interface Side {
    /** Endocanthion to exocanthion, straight 3D distance in mm. */
    fissureLengthMm?: number;
    /** Upper to lower lid margin on the pupil's vertical, in neutral mm. */
    fissureHeightMm?: number;
    /** Exocanthion height minus endocanthion height in the head frame, mm. */
    lateralCanthusRiseMm?: number;
    /** Upper-lid margin to crease on the pupil's vertical, mm; absent if no visible crease. */
    upperCreaseHeightMm?: number;
    /** Centre of pupil to lower eyebrow margin on the same vertical, mm. */
    pupilToBrowMm?: number;
    /** Horizontal nasal-to-temporal limbus diameter, white-to-white in mm. */
    horizontalLimbusDiameterMm?: number;
    /** Internal cornea-to-retina axial length in mm; requires ocular biometry. */
    globeAxialLengthMm?: number;
    /** Mean central anterior corneal curvature radius in mm. */
    anteriorCornealRadiusMm?: number;
    /** Central corneal full thickness in micrometres. */
    centralCornealThicknessMicrometres?: number;
  }
}
