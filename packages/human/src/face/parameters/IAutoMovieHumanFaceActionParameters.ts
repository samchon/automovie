/**
 * Observed facial-action appearances in the Facial Action Coding System.
 * The named Action Units describe visible effects associated with facial
 * musculature, not a one-to-one muscle-force or mesh-blendshape measurement
 * (https://pmc.ncbi.nlm.nih.gov/articles/PMC2826128/;
 * https://pmc.ncbi.nlm.nih.gov/articles/PMC3008553/;
 * https://pmc.ncbi.nlm.nih.gov/articles/PMC4157835/). A–E are ordered FACS
 * trace-to-maximum appearance categories, not equal physical increments
 * (https://pmc.ncbi.nlm.nih.gov/articles/PMC4644350/). `none` records an
 * observed absence; omission remains unknown. Lateral sides are independent.
 * Jaw, lid aperture and gaze also have separate physical measurements; their
 * co-occurrence must be checked against the same rendered performance. No
 * action value is a source morph weight, direct tissue offset or free curve.
 *
 * @evidence contracts/common.md#principled-implementation Named ordinal action appearances remain observations, separately grouped by side and midline; the performance observation rule keeps them without mapping them onto expression weights or claiming physiological force conversion.
 * @evidence contracts/common.md#clear-and-simple-design Independent left/right Side records and one Midline record expose observed symmetry without a numerical blendshape array or another rig abstraction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No AU intensity becomes a morph weight, tissue offset or equal physical increment; unimplemented anatomical lowering and rendered same-state comparison remain explicit.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes ordinal visible appearance, explicit none versus omission, independent sides and separate jaw/lid/gaze measurements.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This observation interface chooses no FACS detection, muscle-force or mesh-processing algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The action record coordinates no expression requests or computed pose cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The declaration retains no rendered frame or rig handle; the performance document owns its optional ordinal records.
 *
 * @publicUnconsumed createHumanFaceAnatomicalResolver: Facial-action observations await anatomically coupled lowering and rendered same-state verification.
 * @author Samchon
 */
export interface IAutoMovieHumanFaceActionParameters {
  /** Anatomical-left appearance, for actions that may be asymmetric. */
  left?: IAutoMovieHumanFaceActionParameters.Side;

  /** Anatomical-right appearance, independently observed. */
  right?: IAutoMovieHumanFaceActionParameters.Side;

  /** Midline and bilateral whole-mouth appearances. */
  midline?: IAutoMovieHumanFaceActionParameters.Midline;
}

export namespace IAutoMovieHumanFaceActionParameters {
  /**
   * FACS ordinal appearance, including explicit observed absence.
   *
   * @evidence contracts/common.md#principled-implementation The closed union preserves none and the ordered A through E appearance categories as labels, with no arithmetic interpretation.
   * @evidence contracts/common.md#clear-and-simple-design One intensity vocabulary is shared by every declared lateral and midline action.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts An ordinal label is neither a numeric morph weight nor a manufactured physiological interval; unknown remains omission at its containing field.
   * @evidence contracts/common.md#meaningful-documentation The comment identifies ordinal appearance and explicit observed absence beyond the literal members.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This literal union performs no intensity estimation or computation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work These labels define no request cache or shared evaluated result.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The erased union acquires no source image, bytes, handle or task.
   *
   * @author Samchon
   */
  export type Intensity = "none" | "A" | "B" | "C" | "D" | "E";

  /**
   * One side's named FACS appearances. The cited studies define their
   * anatomical cues, not separate population limits for each side.
   *
   * @evidence contracts/common.md#principled-implementation Named optional unilateral AUs share Intensity while leaving each side independently observed; numeric muscle force and anatomical lowering are absent.
   * @evidence contracts/common.md#clear-and-simple-design One Side record groups lateral appearances, and the parent record chooses anatomical left/right without duplicating field vocabularies.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing fields remain unknown, with no symmetric copy, inferred action combination or default intensity.
   * @evidence contracts/common.md#meaningful-documentation Every member identifies its AU number and visible action; the comment keeps anatomical cues separate from side-specific population bounds.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This type lists action observations and executes no lateral detection or rig calculation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The Side shape has no repeated-work coordinator or computed-action cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The declaration owns no image or muscle state allocation; the parent document holds its observed labels.
   *
   * @author Samchon
   */
  export interface Side {
    /** AU1, inner brow raiser. */
    innerBrowRaise?: Intensity;

    /** AU2, outer brow raiser. */
    outerBrowRaise?: Intensity;

    /** AU4, brow lowerer. */
    browLower?: Intensity;

    /** AU5, upper lid raiser. */
    upperLidRaise?: Intensity;

    /** AU6, cheek raiser. */
    cheekRaise?: Intensity;

    /** AU7, lid tightener. */
    lidTighten?: Intensity;

    /** AU9, nose wrinkler. */
    noseWrinkle?: Intensity;

    /** AU10, upper lip raiser. */
    upperLipRaise?: Intensity;

    /** AU11, nasolabial deepener. */
    nasolabialDeepen?: Intensity;

    /** AU12, lip-corner puller. */
    lipCornerPull?: Intensity;

    /** AU14, dimpler. */
    dimple?: Intensity;

    /** AU15, lip-corner depressor. */
    lipCornerDepress?: Intensity;

    /** AU16, lower lip depressor. */
    lowerLipDepress?: Intensity;

    /** AU18, lip pucker. */
    lipPucker?: Intensity;

    /** AU20, lip stretcher. */
    lipStretch?: Intensity;

    /** AU23, lip tightener. */
    lipTighten?: Intensity;

    /** AU24, lip pressor. */
    lipPress?: Intensity;

    /** AU28, lip suck. */
    lipSuck?: Intensity;
  }

  /**
   * Whole-face FACS appearances whose left/right split is not authored here.
   *
   * @evidence contracts/common.md#principled-implementation Chin raise, lips part, jaw drop and mouth stretch remain optional whole-mouth appearance labels using the shared ordinal Intensity, separate from physical jaw opening.
   * @evidence contracts/common.md#clear-and-simple-design The four centrally authored actions live together without artificial left/right copies.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Whole-mouth appearance supplies no forced bilateral pose, numerical jaw displacement or action-weight conversion.
   * @evidence contracts/common.md#meaningful-documentation The comment supplies the unsplit scope and each member names its AU and visible effect.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This record declares central observations and performs no mouth measurement or mesh traversal.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The Midline type coordinates no repeated performance evaluation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This interface acquires no rig or frame resource; optional labels belong to the performance record.
   *
   * @author Samchon
   */
  export interface Midline {
    /** AU17, chin raiser. */
    chinRaise?: Intensity;

    /** AU25, lips part. */
    lipsPart?: Intensity;

    /** AU26, jaw drop. */
    jawDrop?: Intensity;

    /** AU27, mouth stretch. */
    mouthStretch?: Intensity;
  }
}
