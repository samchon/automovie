/**
 * Observed regional skin lines and lower-face sagging in named clinical
 * photonumeric protocols. These grades are ordinal categories: grade 2 is
 * neither twice grade 1 nor a millimetre wrinkle-depth instruction. Rest and
 * maximum-contraction readings are distinct observations of the same person;
 * an arbitrary in-between expression cannot be inferred by interpolating
 * grades. Acquisition pose, view, lighting and rater protocol matter.
 *
 * Lorenc et al. (2025, Aesthetic Surgery Journal Open Forum) validated a
 * four-grade family measuring forehead, glabellar and lateral
 * canthal lines at rest and at the appropriate maximum expression
 * (https://pmc.ncbi.nlm.nih.gov/articles/PMC12617410/). Its published labels
 * are 1 (none/minimal), 2 (mild), 3 (moderate) and 4 (severe); these fields
 * retain those raw labels, with omission meaning unobserved. The study used
 * standardized photographs of approximately 200 adults with healthy skin
 * and live validation in 92 participants at one site, predominantly White
 * women. Those reliability findings do not validate a 3D geometry mapping.
 * Separate validated
 * instruments measure nasolabial folds on grades 0–5
 * (https://pubmed.ncbi.nlm.nih.gov/20679841/), marionette lines on grades 0–4
 * (https://pmc.ncbi.nlm.nih.gov/articles/PMC10833177/), superficial midface
 * fine lines on grades 0–4 (https://pmc.ncbi.nlm.nih.gov/articles/PMC5671789/),
 * infraorbital hollows on grades 0–3
 * (https://pmc.ncbi.nlm.nih.gov/articles/PMC10411921/), and jawline sagging
 * on grades 1–5 (https://onlinelibrary.wiley.com/doi/10.1111/jocd.14661).
 * Their categories cannot be pooled into one interchangeable "skin age".
 * The cited fine-line validation photographed the left cheek at 45 degrees;
 * the right-side field uses the same mirrored region definition but has no
 * separate right-side reliability claim from that study.
 * None of these observations determines a unique 3D crease, fat compartment,
 * elastic modulus or person's age. A future resolver must reproduce the
 * observed regional result without accepting a free curve or vertex edit.
 *
 * @evidence contracts/common.md#principled-implementation Independent regional ordinal instruments preserve rest/maximal contraction, protocol and laterality rather than a pooled skin-age scalar. Current observation rules keep these grades without anatomical surface lowering.
 * @evidence contracts/common.md#clear-and-simple-design The parent assigns anatomical sites and UpperLine owns the upper-face protocol and paired acquisition states; other scales retain their own literal labels.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Grades are not proportional lengths, independent sculptable tissue controls or interpolable expression weights; cohort reliability does not certify a 3D mapping or right-side validation.
 * @evidence contracts/common.md#meaningful-documentation The comment states acquisition conditions, raw categories, population/laterality limitations and unresolved geometry, while fields name each instrument's region.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interface performs no grading, wrinkle construction or surface mapping.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Regional observation grouping defines no shared rater result or repeated-pose cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no photographs, skin meshes or rater tasks; the personal record owns optional grades.
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
   *
   * @evidence contracts/common.md#principled-implementation A required source protocol and independently observed resting/maximal grades retain the published one-based category meanings instead of an older zero-based interpretation.
   * @evidence contracts/common.md#clear-and-simple-design One UpperLine shape serves forehead, glabella and lateral canthus while the parent supplies the prescribed site/expression.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The protocol does not automatically migrate records, infer unobserved grades or turn ordinal categories into proportional geometry.
   * @evidence contracts/common.md#meaningful-documentation Members name the source identity and raw severity labels, distinguishing absent acquisition from none/minimal.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This record runs no photonumeric grading or expression interpolation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The protocol literal defines acquisition identity without a shared measured-result cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The declaration retains no photographs or evaluator resource; its owner holds at most two optional grades.
   *
   * @author Samchon
   */
  export interface UpperLine {
    /**
     * Required source identity so an older zero-based record cannot silently
     * acquire the published raw-label meaning. No automatic migration occurs.
     */
    protocol: "medytox-upper-face-2025";

    /** Published resting severity: 1 none/minimal, 2 mild, 3 moderate, 4 severe. */
    restGrade?: 1 | 2 | 3 | 4;

    /** Same raw labels at the site's prescribed maximum expression. */
    maximumContractionGrade?: 1 | 2 | 3 | 4;
  }
}
