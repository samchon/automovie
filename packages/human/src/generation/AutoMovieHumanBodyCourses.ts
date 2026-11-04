/**
 * Defaults of the foot's girths and lengths and the crotch's courses that
 * `AutoMovieHumanBodyAnatomy.resolve` reads: each an ordinary least squares
 * line by sex on the Human input that predicts it best, or a surveyed share.
 *
 * Surveys: ANSUR II (Gordon et al. 2014, NATICK/TR-15/007; 1,986 women and
 * 4,082 men, `docs/sources/ansur-ii.md`) and ANSUR 1988 (Gordon et al. 1989,
 * NATICK/TR-89/044; 2,208 women and 1,774 men, `docs/sources/ansur-1988.md`).
 * Every value is printed from the public files by `test_human_survey_foot`
 * and `test_human_survey_pelvis` (`test/src/features/human/survey/`).
 */
export namespace AutoMovieHumanBodyCourses {
  /** One sex's straight line `a + b x`, mm. */
  export interface ILine {
    /** Intercept, mm. */
    a: number;

    /** Slope, mm per mm of the predictor. */
    b: number;
  }

  /**
   * Ball-of-foot circumference (`balloffootcircumference`) on the foot breadth
   * (`footbreadthhorizontal`), ANSUR II: R2 0.74 and 0.75, residual SD 6.0 and
   * 6.4 mm (on the foot length 0.37 and 0.36).
   */
  export const BALL_OF_FOOT_ON_FOOT_BREADTH: readonly [ILine, ILine] = [
    { a: 32.0, b: 2.1153 },
    { a: 33.53, b: 2.145 },
  ];

  /**
   * Heel-ankle circumference (`heelanklecircumference`) on the foot length,
   * ANSUR II: R2 0.64 and 0.63, residual SD 9.1 and 10.1 mm (on the heel
   * breadth 0.41 and 0.39, on the ankle circumference 0.42 and 0.52).
   */
  export const HEEL_ANKLE_ON_FOOT_LENGTH: readonly [ILine, ILine] = [
    { a: 66.9, b: 0.9883 },
    { a: 70.49, b: 1.0067 },
  ];

  /**
   * Instep length (`INSTEP_LNTH`) on the foot length (`FOOT_LNTH`), ANSUR
   * 1988, which ANSUR II does not take: R2 0.90 and 0.84, residual SD 3.0 and
   * 4.2 mm.
   */
  export const INSTEP_ON_FOOT_LENGTH: readonly [ILine, ILine] = [
    { a: -2.44, b: 0.744 },
    { a: -1.65, b: 0.7329 },
  ];

  /**
   * Crotch length at omphalion (`crotchlengthomphalion`) on the buttock
   * circumference, ANSUR II: R2 0.41 and 0.51, residual SD 32.7 mm (on
   * stature 0.20 and 0.17).
   */
  export const CROTCH_ON_HIP: readonly [ILine, ILine] = [
    { a: 256.23, b: 0.357 },
    { a: 179.88, b: 0.434 },
  ];

  /**
   * The posterior crotch length's share of the crotch length, ANSUR II, the
   * per-subject ratio's mean: 0.5509 (SD 0.0326) and 0.5728 (0.0374). It
   * predicts the posterior part better than any line (on the buttock
   * circumference R2 0.16 and 0.13, on stature 0.14 and 0.15).
   */
  export const POSTERIOR_CROTCH_SHARE: readonly [number, number] = [0.5509, 0.5728];

  /**
   * Lower thigh circumference at suprapatella on stature, body mass index and
   * age, women and men: ANSUR II model B (`docs/sources/ansur-ii.md`, "Model
   * B girth regressions"), R2 0.71 and 0.79, residual SD 18.9 and 14.6 mm,
   * `a + stature S + bmi BMI + age A` with S in mm.
   */
  export const LOWER_THIGH_MODEL: readonly [
    { readonly a: number; readonly stature: number; readonly bmi: number; readonly age: number },
    { readonly a: number; readonly stature: number; readonly bmi: number; readonly age: number },
  ] = [
    { a: -45.2, stature: 0.1538, bmi: 8.0, age: -0.3 },
    { a: -11.8, stature: 0.1383, bmi: 6.75, age: -0.29 },
  ];

  /** ANSUR II's mean age by sex, years, 28.9 and 30.2 (`docs/sources/ansur-ii.md`): the age model B is read at. */
  export const ANSUR_II_AGE: readonly [number, number] = [28.9, 30.2];

  /**
   * The lower thigh circumference's default: model B at the body mass index
   * the person's fat percentage implies by Deurenberg et al.'s relation
   * (1991, Br J Nutr 65(2):105-114: percent fat = 1.2 BMI + 0.23 age - 10.8
   * male - 5.4), held in the fit's 17 to 40 kg/m2, at ANSUR II's mean age.
   *
   * @param male 0 for a woman, 1 for a man.
   * @param stature Stature, mm.
   * @param fat Body fat percentage.
   * @returns The girth, mm.
   */
  export function lowerThigh(male: 0 | 1, stature: number, fat: number): number {
    const m: (typeof LOWER_THIGH_MODEL)[number] = LOWER_THIGH_MODEL[male];
    const age: number = ANSUR_II_AGE[male];
    const bmi: number = Math.min(40, Math.max(17, (fat - 0.23 * age + 10.8 * male + 5.4) / 1.2));
    return m.a + m.stature * stature + m.bmi * bmi + m.age * age;
  }
}
