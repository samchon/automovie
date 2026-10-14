import type { IAutoMovieHumanFaceLowerEyelidParameters } from "./IAutoMovieHumanFaceLowerEyelidParameters";

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
 * Pupil diameter is light dependent: infrared pupillometry measured both
 * eyes under successive 0, 0.5, 4, 32 and 250 lux illuminances after two
 * minutes of low-mesopic adaptation, with decreasing diameter as illuminance
 * rose (https://pmc.ncbi.nlm.nih.gov/articles/PMC5278786/).
 * A fixed-illuminance observation must not be mistaken for permanent iris
 * size or copied unchanged into every rendered lighting condition.
 * Eye appearance, gaze and eyelid motion have different owners.
 *
 * @evidence contracts/common.md#principled-implementation Bilateral canthal/pupil distances and independent eye records separate neutral surface acquisition from internal optical biometry. Observation rules compare registered eye measurements while crease acquisition and physiological light-adapted pupil measurement remain distinct unresolved protocols.
 * @evidence contracts/common.md#clear-and-simple-design Shared inter-eye distances belong here, each eye's aperture/optics to Side, and appearance/gaze/performance to their existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A photographed aperture does not reveal globe axial length or corneal thickness, and a fixed-lux pupil reading does not become a permanent iris size or universal lighting response.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes visible limbus from pigment, internal biometry, adapted illuminance and independent motion/appearance; members name neutral canthal and pupil distances in millimetres.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interface performs no optical fitting, pupillometry or surface measurement.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The observation shape defines no shared eye measurement or source-dependent cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The declaration acquires no eye mesh, instrument or image resource; the document owns the optional observed records.
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
   *
   * @evidence contracts/common.md#principled-implementation Named aperture/canthus/crease/brow and optical fields keep their own acquisition protocols and units; null crease records observed absence, while omission is unknown. The declaration supplies no numerical admission or physiological pupil conversion itself.
   * @evidence contracts/common.md#clear-and-simple-design One Side record owns a single eye and delegates lower-eyelid tissues to their explicit parameter owner rather than another generic optical scalar.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Visible pigment is not white-to-white limbus, a source sphere is not clinical axial length, and missing crease or lower-tissue measurements are not inferred from a photograph.
   * @evidence contracts/common.md#meaningful-documentation Fields state landmark pairs, neutral signed canthus rise, absent/unknown crease, the 250-lux acquisition, millimetres and corneal micrometres.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This record chooses no ocular geometry or measurement algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work It coordinates no repeat optical acquisition or cached per-eye solve.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no globe, pupil camera or corneal resource; its parent document owns the scalar observations.
   *
   * @author Samchon
   */
  export interface Side {
    /** Endocanthion to exocanthion, straight 3D distance in mm. */
    fissureLengthMm?: number;

    /** Upper to lower lid margin on the pupil's vertical, in neutral mm. */
    fissureHeightMm?: number;

    /** Exocanthion height minus endocanthion height in the head frame, mm. */
    lateralCanthusRiseMm?: number;

    /** Upper-lid margin to visible crease on the pupil vertical, mm; null means observed absent, omission means unknown. */
    upperCreaseHeightMm?: number | null;

    /** Centre of pupil to lower eyebrow margin on the same vertical, mm. */
    pupilToBrowMm?: number;

    /** Horizontal nasal-to-temporal limbus diameter, white-to-white in mm. */
    horizontalLimbusDiameterMm?: number;

    /** Pupil diameter during the 250-lux step of that adapted, ascending protocol, mm. */
    pupilDiameterAt250LuxMm?: number;

    /** Internal cornea-to-retina axial length in mm; requires ocular biometry. */
    globeAxialLengthMm?: number;

    /** Mean central anterior corneal curvature radius in mm. */
    anteriorCornealRadiusMm?: number;

    /** Central corneal full thickness in micrometres. */
    centralCornealThicknessMicrometres?: number;

    /** Distinct lower-eyelid tissues and observed bag contributors. */
    lowerEyelid?: IAutoMovieHumanFaceLowerEyelidParameters;
  }
}
