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
  /** FACS ordinal appearance, including explicit observed absence. */
  export type Intensity = "none" | "A" | "B" | "C" | "D" | "E";

  /**
   * One side's named FACS appearances. The cited studies define their
   * anatomical cues, not separate population limits for each side.
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
