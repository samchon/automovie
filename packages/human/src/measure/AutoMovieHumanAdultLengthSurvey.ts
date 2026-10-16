import { AutoMovieHumanSex } from "../structures/AutoMovieHumanSex";

/**
 * Adult regression coefficients, measured ratios and conventional mappings used by the length estimator. Regression inputs retain millimetres, kilograms, BMI and years; no geometry or identity-specific correction belongs here.
 */
export namespace AutoMovieHumanAdultLengthSurvey {
  /**
   * Adult thumb length over hand length: the 1987-1988 US Army hand survey's digit 1 length, tip to the proximal flexion crease over the metacarpophalangeal joint, 6.35 cm in 1,304 women and 6.97 cm in 1,003 men, over measured hand length, 18.07 and 19.41 cm (Greiner 1991, NATICK/TR-92/011, measurements 1 and 59). Children take it times the 1977 survey's thumb share at their age over its share at 16 to 18 years. Grade: measured, ratio derived.
   */
  export const GREINER_THUMB: Record<AutoMovieHumanSex, number> = {
    female: 0.3514,
    male: 0.3591,
  };

  /**
   * A linear regression `intercept + stature·S + mass·m + bmi·B + age·a` in millimetres, with stature in millimetres, body mass in kilograms, body mass index in kilograms per square metre and age in years; absent terms are zero.
   *
   * @author Samchon
   */
  export interface IRegression {
    /** Constant contribution in millimetres. */
    intercept: number;

    /** Millimetres of output per millimetre of peak stature. */
    stature: number;

    /** Millimetres per kilogram of body mass; omitted terms contribute zero. */
    mass?: number;

    /** Millimetres per kilogram per square metre of BMI; omitted terms contribute zero. */
    bmi?: number;

    /** Millimetres per year of the regression age; omitted terms contribute zero. */
    age?: number;
  }

  /**
   * Adult lengths and bony breadths, our ordinary least squares fits per sex on the public ANSUR II working databases (Gordon et al. 2014, NATICK/TR-15/007; Paquette and Parham 2017), 1,986 women and 4,082 men aged 17 to 58. Heights and long bones regress on stature alone, hand and foot on stature and body mass, bony breadths and the soft-tissue hip breadth on stature, BMI and age; every fit passes through the sample means. Valid within about 1,400 to 2,000 mm stature, BMI 17 to 40 and age 17 to 58. Grade: population-fitted.
   */
  export const ANSUR_II: Record<
    | "sittingHeight"
    | "cervicaleHeight"
    | "suprasternaleHeight"
    | "acromialHeight"
    | "upperArm"
    | "forearm"
    | "tibiale"
    | "trochanterion"
    | "hand"
    | "handBreadth"
    | "foot"
    | "ankle"
    | "biacromial"
    | "bicristal"
    | "hipBreadth",
    Record<AutoMovieHumanSex, IRegression>
  > = {
    sittingHeight: {
      female: { intercept: 215.8, stature: 0.3935 },
      male: { intercept: 205.8, stature: 0.4057 },
    },
    cervicaleHeight: {
      female: { intercept: -90.4, stature: 0.9126 },
      male: { intercept: -78.1, stature: 0.9084 },
    },
    suprasternaleHeight: {
      female: { intercept: -93.6, stature: 0.874 },
      male: { intercept: -101.4, stature: 0.8769 },
    },
    acromialHeight: {
      female: { intercept: -96.9, stature: 0.8793 },
      male: { intercept: -126.9, stature: 0.8926 },
    },
    upperArm: {
      female: { intercept: -34.0, stature: 0.212 },
      male: { intercept: -20.9, stature: 0.2028 },
    },
    forearm: {
      female: { intercept: -24.5, stature: 0.1632 },
      male: { intercept: -14.4, stature: 0.1608 },
    },
    tibiale: {
      female: { intercept: -103.6, stature: 0.3325 },
      male: { intercept: -119.1, stature: 0.3344 },
    },
    trochanterion: {
      female: { intercept: -126.9, stature: 0.597 },
      male: { intercept: -169.9, stature: 0.6098 },
    },
    hand: {
      female: { intercept: 30.8, stature: 0.0847, mass: 0.181 },
      male: { intercept: 30.0, stature: 0.0883, mass: 0.097 },
    },
    handBreadth: {
      female: { intercept: 41.6, stature: 0.0176, mass: 0.118 },
      male: { intercept: 46.6, stature: 0.0176, mass: 0.126 },
    },
    foot: {
      female: { intercept: 37.9, stature: 0.118, mass: 0.239 },
      male: { intercept: 44.9, stature: 0.12, mass: 0.173 },
    },
    ankle: {
      female: { intercept: 6.0, stature: 0.0348 },
      male: { intercept: 5.0, stature: 0.0387 },
    },
    biacromial: {
      female: { intercept: 84.8, stature: 0.1583, bmi: 1.08, age: -0.17 },
      male: { intercept: 106.3, stature: 0.1482, bmi: 1.91, age: -0.12 },
    },
    bicristal: {
      female: { intercept: -22.7, stature: 0.1229, bmi: 3.5, age: 0.23 },
      male: { intercept: -8.4, stature: 0.1291, bmi: 2.19, age: -0.11 },
    },
    hipBreadth: {
      female: { intercept: -25.7, stature: 0.1443, bmi: 5.59, age: 0.07 },
      male: { intercept: -14.9, stature: 0.1345, bmi: 4.59, age: -0.09 },
    },
  };

  /**
   * Adult ratios of ANSUR II means (measured): palm length over hand length, foot breadth over foot length and lateral malleolus height over foot length. The last stands in for children, whose ankle height the 1977 survey did not measure.
   */
  export const ANSUR_II_RATIOS: Record<
    "palm" | "footBreadth" | "ankle",
    Record<AutoMovieHumanSex, number>
  > = {
    palm: { female: 0.601, male: 0.603 },
    footBreadth: { female: 0.376, male: 0.376 },
    ankle: { female: 0.255, male: 0.269 },
  };

  /**
   * One unit of slimness as a share of stature: two residual standard deviations of the ANSUR II sitting-height fit (21.3 mm women, 22.4 mm men, about 0.013 of mean stature) and of the biacromial and bicristal fits (14.6 and 16.1 mm women, 14.4 and 12.4 mm men, about 0.0086 of stature). Grade: conventional mapping onto population-fitted spreads.
   */
  export const SLIMNESS: Record<"sittingHeight" | "breadth", number> = {
    sittingHeight: 2 * 0.013,
    breadth: 2 * 0.0086,
  };

  /**
   * Span from the person's own segments with the arms outstretched. Abducting the arm 90 degrees brings the acromion markedly closer to the radiale: de Leva measured acromion-radiale abducted at 235.9 mm in women and 244.8 mm in men, against 322.7 and 330.5 mm adducted from his own shoulder and elbow offsets (33.7 and 13.9, 34.5 and 14.3 mm) and upper-arm lengths (275.1 and 281.7 mm), so an outstretched upper arm reaches 0.731 and 0.741 of its hanging acromion-radiale beyond the acromion (de Leva 1996, J Biomech 29(9):1223-1230, Tables 1, 2 and 4). Span is then biacromial breadth plus, on each side, that reach, the forearm and the hand. Over the ANSUR II working databases this predicts measured span within 1.4 percent (SD of the ratio) and overestimates the mean by 0.3 percent in women and 1.1 percent in men, so the result is scaled by the measured-over-predicted means (0.997 and 0.9888; our computation on the public records, Gordon et al. 2014, NATICK/TR-15/007). Children take the same relation; no child span was read. Grade: measured, then derived.
   */
  export const SPAN: Record<
    "reach" | "calibration",
    Record<AutoMovieHumanSex, number>
  > = {
    reach: { female: 0.731, male: 0.7407 },
    calibration: { female: 0.997, male: 0.9888 },
  };
}
