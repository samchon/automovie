/**
 * Defaults of the trunk's published breadths and depths: each measure's
 * ordinary least squares line by sex on the girth that wraps its own level,
 * fitted on the public working databases, which `AutoMovieHumanBodyAnatomy.resolve`
 * reads before holding them inside each level's box
 * (`AutoMovieHumanBodyBox.place`).
 *
 * Surveys: ANSUR 1988 (Gordon et al. 1989, NATICK/TR-89/044; 2,208 women and
 * 1,774 men, `docs/sources/ansur-1988.md`) and ANSUR II (Gordon et al. 2014,
 * NATICK/TR-15/007; 1,986 women and 4,082 men, `docs/sources/ansur-ii.md`).
 * Every line is reproduced by `test_human_survey_trunk_breadths` and
 * `test_human_survey_waist_section` (`test/src/features/human/survey/`), which
 * print the coefficients, R2 and residual SD from the public files.
 */
export namespace AutoMovieHumanBodyBreadths {
  /** One sex's straight line `a + b x`, mm. */
  export interface ILine {
    /** Intercept, mm. */
    a: number;

    /** Slope, mm per mm of the predictor. */
    b: number;
  }

  /**
   * Chest depth (`CHEST_DEPTH`) on chest circumference (`CHEST_CIRC`), ANSUR
   * 1988: R2 0.81 and 0.80, residual SD 9.2 and 9.6 mm.
   */
  export const CHEST_DEPTH_ON_CHEST: readonly [ILine, ILine] = [
    { a: -31.82, b: 0.299 },
    { a: -32.32, b: 0.2779 },
  ];

  /**
   * The navel section's breadth (`WAIST_BRTH_OMPHALION`) on its own girth
   * (`WAIST_CIRC-OMPHALION`), ANSUR 1988: R2 0.91 and 0.92, residual SD 8.4
   * and 8.0 mm. No survey takes a breadth at the natural waist, so the natural
   * waist's default is this line at the natural waist girth, the derivation
   * premised on the lumbar section keeping the navel section's law over the
   * 74 (SD 21) and 68 (18) mm between the two levels; evaluated at each
   * surveyed natural girth it gives 268.0 (20.6) and 302.1 (23.6) mm, and no
   * subject's natural girth falls outside the derived box.
   */
  export const WAIST_BREADTH_ON_WAIST: readonly [ILine, ILine] = [
    { a: 31.41, b: 0.3261 },
    { a: 34.5, b: 0.3186 },
  ];

  /**
   * The navel section's depth (`WAIST_DEPTH-OMPHALION`) on its girth, ANSUR
   * 1988: R2 0.85 and 0.87, residual SD 9.7 and 9.1 mm; at the natural waist
   * as {@link WAIST_BREADTH_ON_WAIST}, 185.6 (17.5) and 220.0 (20.5) mm.
   */
  export const WAIST_DEPTH_ON_WAIST: readonly [ILine, ILine] = [
    { a: -15.4, b: 0.277 },
    { a: -12.23, b: 0.2765 },
  ];

  /**
   * Hip breadth (`HIP_BRTH`) on buttock circumference (`BUTTOCK_CIRC`), ANSUR
   * 1988: R2 0.84 and 0.81, residual SD 9.1 and 8.7 mm.
   */
  export const HIP_BREADTH_ON_HIP: readonly [ILine, ILine] = [
    { a: 13.45, b: 0.3406 },
    { a: 52.6, b: 0.294 },
  ];

  /**
   * Buttock depth (`BUTT_DEPTH`) on buttock circumference, ANSUR 1988: R2
   * 0.64 and 0.77, residual SD 12.6 and 10.0 mm.
   */
  export const BUTTOCK_DEPTH_ON_HIP: readonly [ILine, ILine] = [
    { a: -42.22, b: 0.2785 },
    { a: -39.29, b: 0.2927 },
  ];

  /**
   * Bideltoid breadth (`BIDELTOID_BRTH`) on chest circumference, ANSUR 1988:
   * R2 0.59 and 0.70, residual SD 14.6 and 14.3 mm, the best of the Human's
   * inputs (the natural waist and buttock girths 0.54 and 0.49 in women,
   * biacromial breadth 0.40, stature 0.14). The shoulder circumference over
   * the deltoids would predict it at 0.86 and 0.87, but is not an input.
   */
  export const BIDELTOID_ON_CHEST: readonly [ILine, ILine] = [
    { a: 185.09, b: 0.2729 },
    { a: 180.94, b: 0.3135 },
  ];

  /**
   * Bicristal breadth (`bicristalbreadth`) on hip breadth (`hipbreadth`),
   * ANSUR II, since ANSUR 1988 takes none: R2 0.49 and 0.51, residual SD 15.9
   * and 12.3 mm, the best of the Human's inputs (the buttock girth 0.45 and
   * 0.42, stature 0.15 and 0.26).
   */
  export const BICRISTAL_ON_HIP_BREADTH: readonly [ILine, ILine] = [
    { a: 67.19, b: 0.5825 },
    { a: 96.96, b: 0.5162 },
  ];
}
