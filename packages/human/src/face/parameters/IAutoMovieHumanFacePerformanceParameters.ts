import type { IAutoMovieHumanFaceActionParameters } from "./IAutoMovieHumanFaceActionParameters";

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
 * Clinical mouth opening is also measured as the distance between the
 * maxillary and mandibular central incisal edges at the midline
 * (https://pmc.ncbi.nlm.nih.gov/articles/PMC3428458/). It exists only when
 * those teeth or documented prosthetic equivalents are present; lip separation
 * is a different clearance.
 * Four-dimensional stereophotogrammetry also defines lip-purse magnitude as
 * the mean 3D rest-to-performance displacement of labiale superius and
 * labiale inferius; that scalar is an observed outcome of coordinated lip
 * motion, not an editable pair of XYZ targets
 * (https://pmc.ncbi.nlm.nih.gov/articles/PMC10560183/).
 * These source measurements do not supply a universal independent box of
 * valid simultaneous motions; a future resolver must preserve teeth, globe,
 * tongue and tissue contact when it maps the named values to joints and skin.
 *
 * @evidence contracts/common.md#principled-implementation Named observed jaw, eye, tissue and tongue outcomes are relative to one neutral identity rather than free vertex deltas. Current rules retain performance observations and compare registered incisal/interlabial quantities; anatomical lowering of the record onto expression weights and several readouts remain unimplemented.
 * @evidence contracts/common.md#clear-and-simple-design Physical jaw/eye/side records remain separate from ordinal FACS appearances, with explicit midline lip and tongue outcomes instead of an undifferentiated motion vector.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Lip clearance is not incisal opening, no fixed universal hinge or independent extreme box is certified, and observed lip-purse magnitude supplies no pair of editable XYZ targets.
 * @evidence contracts/common.md#meaningful-documentation Members state reference, anatomical signs, millimetres/degrees and dental/oral-passage premises; the comment distinguishes coordinated observed outcomes from independent rig controls.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interface evaluates no pose, tissue transport or inverse expression mapping.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The observation shape defines no shared performed-state computation or reference-identity cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no rig, collision handle or task; the personal record owns optional observed motions.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFacePerformanceParameters {
  /** Observed ordinal FACS appearances, distinct from physical displacements. */
  actions?: IAutoMovieHumanFaceActionParameters;

  /** Mandible relative to the identity's intercuspal neutral. */
  jaw?: {
    /** Nonnegative opening rotation in degrees; translation follows a supported joint path. */
    openingDegrees?: number;

    /** Nonnegative central-incisor edge gap in mm; requires those dental edges. */
    interincisalGapMm?: number;

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
   *
   * @evidence contracts/common.md#principled-implementation Two signed gaze angles and a pupil-vertical aperture describe observed globe/lid performance independently of optical identity; current eye-performance rules keep the record without a registered gaze readout.
   * @evidence contracts/common.md#clear-and-simple-design One Eye record groups gaze and its lid aperture while the parent preserves independent anatomical sides.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Gaze does not resize the globe, a lid gap is not a generic blendshape weight, and these independent fields do not guarantee contact-valid simultaneous extrema.
   * @evidence contracts/common.md#meaningful-documentation Members give anatomical-left/superior signs, degrees and a nonnegative pupil-vertical millimetre aperture.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This record performs no gaze rotation or lid/contact computation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work It coordinates no repeated ocular state evaluation or cached transport.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The declaration acquires no optical mesh or runtime handle; its document owns the optional observations.
   *
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
   *
   * @evidence contracts/common.md#principled-implementation Neutral-relative medial/lateral brow rise and signed cheilion displacements retain named tissue outcomes; current performance observation rules keep them without an inverse to numerical expression channels.
   * @evidence contracts/common.md#clear-and-simple-design One Side record groups its brow and commissure observations while the parent assigns independent left/right records.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither signed scalar becomes a free vertex target or certified isolated tissue motion; no contralateral default fills an unknown side.
   * @evidence contracts/common.md#meaningful-documentation Fields state neutral reference, superior-positive rise and away-from-midline-positive commissure movement in millimetres.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This interface runs no tissue deformation or landmark transport.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Side observations define no repeated expression calculation or shared posed result.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No tissue field, source mesh or motion task is allocated by the type; the document holds its optional scalars.
   *
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
