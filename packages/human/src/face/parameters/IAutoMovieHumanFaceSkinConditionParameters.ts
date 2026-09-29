/**
 * Observed regional skin lines and lower-face sagging in named clinical
 * photonumeric protocols. These grades are ordinal categories: grade 2 is
 * neither twice grade 1 nor a millimetre wrinkle-depth instruction. Rest and
 * maximum-contraction readings are distinct observations of the same person;
 * an arbitrary in-between expression cannot be inferred by interpolating
 * grades. Acquisition pose, view, lighting and rater protocol matter.
 *
 * A validated four-grade family measures forehead, glabellar and lateral
 * canthal lines at rest and at the appropriate maximum expression
 * (https://pmc.ncbi.nlm.nih.gov/articles/PMC12617410/). Separate validated
 * instruments measure nasolabial folds on grades 0–5
 * (https://pubmed.ncbi.nlm.nih.gov/20679841/), marionette lines on grades 0–4
 * (https://pmc.ncbi.nlm.nih.gov/articles/PMC10833177/), superficial midface
 * fine lines on grades 0–4 (https://pmc.ncbi.nlm.nih.gov/articles/PMC5671789/),
 * infraorbital hollows on grades 0–3
 * (https://pmc.ncbi.nlm.nih.gov/articles/PMC10411921/), and jawline sagging
 * on grades 1–5 (https://onlinelibrary.wiley.com/doi/10.1111/jocd.14661).
 * Their categories cannot be pooled into one interchangeable "skin age".
 * None of these observations determines a unique 3D crease, fat compartment,
 * elastic modulus or person's age. A future resolver must reproduce the
 * observed regional result without accepting a free curve or vertex edit.
 *
 * @publicUnconsumed createHumanFaceAnatomicalResolver: Clinical skin-condition observations await a validated anatomical surface mapping and same-protocol rendered review.
 * @author Samchon
 */
export interface IAutoMovieHumanFaceSkinConditionParameters {
  /** Horizontal forehead lines at rest and maximum brow raise. */
  foreheadLines?: IAutoMovieHumanFaceSkinConditionParameters.UpperLine;
  /** Glabellar lines at rest and maximum frown. */
  glabellarLines?: IAutoMovieHumanFaceSkinConditionParameters.UpperLine;
  /** Anatomical-left lateral canthal lines at rest and maximum smile. */
  leftLateralCanthalLines?: IAutoMovieHumanFaceSkinConditionParameters.UpperLine;
  /** Anatomical-right lateral canthal lines at rest and maximum smile. */
  rightLateralCanthalLines?: IAutoMovieHumanFaceSkinConditionParameters.UpperLine;
  /** Superficial left cheek/midface fine lines, excluding the nasolabial fold. */
  leftMidfaceFineLinesGrade?: 0 | 1 | 2 | 3 | 4;
  /** Superficial right cheek/midface fine lines, under the same protocol. */
  rightMidfaceFineLinesGrade?: 0 | 1 | 2 | 3 | 4;
  /** Anatomical-left nasolabial fold, Buchner six-grade protocol. */
  leftNasolabialFoldGrade?: 0 | 1 | 2 | 3 | 4 | 5;
  /** Anatomical-right nasolabial fold, Buchner six-grade protocol. */
  rightNasolabialFoldGrade?: 0 | 1 | 2 | 3 | 4 | 5;
  /** Left melomental/marionette fold, Allergan five-grade protocol. */
  leftMarionetteLineGrade?: 0 | 1 | 2 | 3 | 4;
  /** Right melomental/marionette fold, Allergan five-grade protocol. */
  rightMarionetteLineGrade?: 0 | 1 | 2 | 3 | 4;
  /** Left infraorbital depression and orbital-rim visibility, four-grade protocol. */
  leftInfraorbitalHollowGrade?: 0 | 1 | 2 | 3;
  /** Right infraorbital depression and orbital-rim visibility, four-grade protocol. */
  rightInfraorbitalHollowGrade?: 0 | 1 | 2 | 3;
  /** Whole jawline sagging, Croma five-grade protocol; 1 means none. */
  jawlineSaggingGrade?: 1 | 2 | 3 | 4 | 5;
}

export namespace IAutoMovieHumanFaceSkinConditionParameters {
  /**
   * One of the three upper-face four-grade scales, at rest and at its stated
   * maximum contraction. The integer is a category rather than a length.
   * @author Samchon
   */
  export interface UpperLine {
    /** Resting line severity, grade 0–3. */
    restGrade?: 0 | 1 | 2 | 3;
    /** Site-specific maximum-expression severity, grade 0–3. */
    maximumContractionGrade?: 0 | 1 | 2 | 3;
  }
}
