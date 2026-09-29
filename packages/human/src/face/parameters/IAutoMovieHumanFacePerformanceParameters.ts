/**
 * Observable motion relative to one measured neutral identity.
 * Jaw opening is rotational with coupled condylar translation, not an
 * independent vertex delta or a fixed universal hinge; in-vivo motion studies
 * explicitly question pure initial rotation
 * (https://pmc.ncbi.nlm.nih.gov/articles/PMC12553608/). Ocular duction studies
 * measure directional ranges on defined cohorts
 * (https://pmc.ncbi.nlm.nih.gov/articles/PMC6707237/). Three-dimensional smile
 * studies measure commissure and lip motion against a resting face
 * (https://www.plasticsurgerygroup.co.uk/media/oume4vbf/quantitative-analysis-of-normal-smile-with-3d-stereophotogrammetry-an-aid-to-facial-reanimation.pdf).
 * Four-dimensional stereophotogrammetry also defines lip-purse magnitude as
 * the mean 3D rest-to-performance displacement of labiale superius and
 * labiale inferius; that scalar is an observed outcome of coordinated lip
 * motion, not an editable pair of XYZ targets
 * (https://pmc.ncbi.nlm.nih.gov/articles/PMC10560183/).
 * These source measurements do not supply a universal independent box of
 * valid simultaneous motions; a future resolver must preserve teeth, globe,
 * tongue and tissue contact when it maps the named values to joints and skin.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFacePerformanceParameters {
  /** Mandible relative to the identity's intercuspal neutral. */
  jaw?: {
    /** Nonnegative opening rotation in degrees; translation follows a supported joint path. */
    openingDegrees?: number;
    /** Anterior-positive, posterior-negative mandibular excursion in mm. */
    protrusionMm?: number;
    /** Anatomical-left positive lateral excursion in mm. */
    lateralExcursionMm?: number;
  };
  /** Left globe and eyelid, independently performed. */
  leftEye?: IAutoMovieHumanFacePerformanceParameters.Eye;
  /** Right globe and eyelid, independently performed. */
  rightEye?: IAutoMovieHumanFacePerformanceParameters.Eye;
  /** Left brow and mouth-corner tissue motion. */
  leftFace?: IAutoMovieHumanFacePerformanceParameters.Side;
  /** Right brow and mouth-corner tissue motion. */
  rightFace?: IAutoMovieHumanFacePerformanceParameters.Side;
  /** Nonnegative midline upper-to-lower vermilion gap in mm on the posed rim. */
  interlabialGapMm?: number;
  /** Mean 3D displacement of upper/lower midline labiale during lip purse, mm. */
  lipPurseMagnitudeMm?: number;
  /** Anterior-positive tongue-tip movement from neutral in mm; needs oral passage admission. */
  tongueTipAdvanceMm?: number;
}

export namespace IAutoMovieHumanFacePerformanceParameters {
  /**
   * Gaze uses rotations of an unchanged globe; the lid opens over that globe.
   * @author Samchon
   */
  export interface Eye {
    /** Positive gaze toward anatomical left in degrees. */
    gazeYawDegrees?: number;
    /** Positive gaze superiorly in degrees. */
    gazePitchDegrees?: number;
    /** Nonnegative pupil-vertical upper-to-lower lid margin distance in mm. */
    palpebralApertureMm?: number;
  }

  /**
   * Signed tissue motion at named landmarks, never user-supplied vertices.
   * @author Samchon
   */
  export interface Side {
    /** Superior-positive medial brow movement from neutral in mm. */
    medialBrowRiseMm?: number;
    /** Superior-positive lateral brow movement from neutral in mm. */
    lateralBrowRiseMm?: number;
    /** Superior-positive cheilion movement from neutral in mm. */
    commissureRiseMm?: number;
    /** Cheilion displacement away from the midline positive, toward it negative, mm. */
    commissureLateralMm?: number;
  }
}
