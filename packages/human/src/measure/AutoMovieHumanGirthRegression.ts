import { AutoMovieHumanSex } from "../structures/AutoMovieHumanSex";

/** Adult area fits and the site-specific composition and relaxed-forearm relations used by the girth estimator. Survey coefficients stay with their protocol and range documentation; growth curves have a separate owner. */
export namespace AutoMovieHumanGirthRegression {
  /**
   * A girth regression in cross-sectional area, `girth² = stature · (area + bmi·B + age·a)`, millimetres, with stature in millimetres, body mass index in kilograms per square metre and age in years.
   *
   * A cross-section's area is the tissue a unit of the body's length holds, and that tissue is a mass index times stature: so at a given BMI and composition a girth grows as the square root of stature, while composition adds area rather than girth.
   *
   * @author Samchon
   */
  export interface IRegression {
    /** Area term of girth squared divided by stature, millimetres. */
    area: number;

    /** Area response per BMI unit, with BMI in kg/m^2. */
    bmi: number;

    /** Area response per year inside the adult sample range. */
    age: number;
  }

  /**
   * Adult girths, our least squares fits per sex of `girth² / stature` on BMI and age over the public ANSUR II working databases (Gordon et al. 2014, NATICK/TR-15/007; Paquette and Parham 2017), 1,986 women and 4,082 men aged 17 to 58. Waist is ANSUR's navel waist, used only to carry the natural waist's response; biceps is the flexed girth, whose stature and BMI response stands in for the relaxed upper arm. R² is within 0.016 of girths linear in stature, BMI and age (0.42 to 0.88). In the sample's tall, slim corner (BMI under 20.5 and the tallest quarter; 20 women, 28 men), where linear girths add the population's millimetres per millimetre of stature to a slim person as to a heavy one, the linear fits came out 10 to 17 mm too wide at the buttock and thigh and these within 2, except 11 mm narrow at men's buttock; at the navel waist and chest these fall 10 to 23 mm short there, and over all ten girths they miss the corner by 6 to 7 mm against the linear fits' 7 to 8. Valid within about 1,400 to 2,000 mm stature, BMI 16 to 40 and age 17 to 58. Grade: population-fitted.
   */
  export const ANSUR_II: Record<
    | "neck"
    | "chest"
    | "waist"
    | "buttock"
    | "biceps"
    | "wrist"
    | "thigh"
    | "lowerThigh"
    | "calf"
    | "ankle",
    Record<AutoMovieHumanSex, IRegression>
  > = {
    neck: {
      female: { area: 24.61, bmi: 1.566, age: 0.0838 },
      male: { area: 24.26, bmi: 2.245, age: 0.1313 },
    },
    chest: {
      female: { area: -52.36, bmi: 22.116, age: 1.4864 },
      male: { area: -28.52, bmi: 22.886, age: 1.2438 },
    },
    waist: {
      female: { area: -227.58, bmi: 25.629, age: 1.2181 },
      male: { area: -263.97, bmi: 25.865, age: 1.9542 },
    },
    buttock: {
      female: { area: 46.11, bmi: 23.379, age: 0.0643 },
      male: { area: 64.73, bmi: 19.909, age: -0.6788 },
    },
    biceps: {
      female: { area: -17.31, bmi: 2.863, age: 0.0768 },
      male: { area: -5.47, bmi: 2.9, age: -0.0367 },
    },
    wrist: {
      female: { area: 9.38, bmi: 0.226, age: -0.0134 },
      male: { area: 10.62, bmi: 0.246, age: 0.0083 },
    },
    thigh: {
      female: { area: -32.63, bmi: 10.685, age: -0.1641 },
      male: { area: -21.04, bmi: 9.626, age: -0.6941 },
    },
    lowerThigh: {
      female: { area: 0.3, bmi: 4.048, age: -0.1429 },
      male: { area: 12.44, bmi: 3.175, age: -0.1439 },
    },
    calf: {
      female: { area: 17.8, bmi: 2.89, age: -0.1881 },
      male: { area: 16.72, bmi: 2.729, age: -0.1375 },
    },
    ankle: {
      female: { area: 15.89, bmi: 0.629, age: -0.1105 },
      male: { area: 14.9, bmi: 0.658, age: -0.1004 },
    },
  };

  /** Mean BMI of the NHANES 2015-2018 adults the arm girth means describe, kilograms per square metre, as the report's tables give it to the nearest unit. */
  export const NHANES_ADULT_BMI: number = 29;

  /**
   * Natural waist from the navel waist and the buttock circumference, `intercept + navel·N + buttock·B`, millimetres: our ordinary least squares fits per sex on the public records of the 1988 US Army survey (Gordon et al. 1989, NATICK/TR-89/044; 2,208 women and 1,774 men, records published by the Penn State OpenLab), the last Army survey to measure both waists. Its natural waist is the horizontal girth "at the level of the greatest indentation" of the right side of the torso, or midway between the tenth rib and iliocristale where no single indentation is clear, at quiet respiration; the navel waist is ANSUR II's own omphalion definition. R² 0.80 and residual standard deviation 28.1 mm in women, 0.92 and 21.1 mm in men. The sample means give a natural waist-to-hip ratio of 0.750 (SD 0.043) in women and 0.853 (0.042) in men. Grade: population-fitted.
   */
  export const NATURAL_WAIST: Record<
    AutoMovieHumanSex,
    { intercept: number; navel: number; buttock: number }
  > = {
    female: { intercept: 83.76, navel: 0.569, buttock: 0.1978 },
    male: { intercept: 106.84, navel: 0.7868, buttock: 0.0554 },
  };

  /**
   * Relaxed maximum forearm girth from the relaxed upper arm and the wrist girths, `intercept + upperArm·U + wrist·W`, millimetres: our ordinary least squares fits per sex on the 1977 US child survey's individual records (Snyder et al. 1977, UM-HSRI-77-17; NIST AnthroKids), 670 boys and 641 girls aged 2 to 18.5, all three girths taken standing with the arms hanging, the forearm "the maximum circumference ... perpendicular to the long axis of the limb", the wrist the minimum above the ulnar styloid. R² 0.965 and 0.953, residual standard deviations 7.5 and 6.5 mm. ANSUR II measures only a flexed forearm girth, across the elbow crease with the fist clenched (Gordon et al. 2014), which is not the relaxed limb the identity describes. Adults extend the relation past 18.5 years, where no relaxed forearm girth was read; within the 16-to-18.5-year records alone it predicts the same adult forearms within 1%. Grade: population-fitted.
   */
  export const RELAXED_FOREARM: Record<
    AutoMovieHumanSex,
    { intercept: number; upperArm: number; wrist: number }
  > = {
    female: { intercept: 8.18, upperArm: 0.5129, wrist: 0.6143 },
    male: { intercept: 0.82, upperArm: 0.5416, wrist: 0.6536 },
  };

  /**
   * How fat and limb lean mass each move a girth, as multiples of the girth's own response to BMI: our least squares fits of `girth² / stature` of NHANES adults 18 to 40 on the DXA fat mass index and the appendicular lean mass index (2017-2018 cycle for the waist at the iliac crest, hip and relaxed mid-upper arm, 657 to 661 women and 635 to 636 men; 1999-2004 cycles, first imputation, for the mid-thigh and the calf, 1,903 to 1,913 women and 2,086 to 2,097 men; National Center for Health Statistics public-use files DXX, BMX and DEMO), each coefficient over the same girth's coefficient on BMI, the form of {@link ANSUR_II}. R² 0.82 to 0.93. Among NHANES's tall, lean adults (the leanest quarter by fat mass index and the tallest 40%; 74 to 237 per site and sex) girths linear in stature, fat mass index and limb lean mass index came out 10 to 19 mm too wide at the iliac crest waist and 1 to 7 mm at the hip, arm and thigh, and these within 6 except 21 mm narrow at women's hip. A unit of fat mass index adds 1.6 times the area a unit of BMI adds at a man's waist while a unit of limb lean mass adds 0.61 times; at the arm it is 0.88 and 2.6 times: fat goes to the trunk, lean to the limbs and the shoulders. In the population a unit of BMI carries about 0.53 to 0.65 units of fat mass index and 0.17 to 0.21 of limb lean mass index, which these factors return within 2%. Grade: population-fitted.
   */
  export const COMPOSITION_SPLIT: Record<
    "waist" | "hip" | "arm" | "thigh" | "calf",
    Record<AutoMovieHumanSex, { fat: number; lean: number }>
  > = {
    waist: {
      male: { fat: 1.612, lean: 0.606 },
      female: { fat: 1.365, lean: 0.891 },
    },
    hip: {
      male: { fat: 1.367, lean: 1.304 },
      female: { fat: 1.35, lean: 1.008 },
    },
    arm: {
      male: { fat: 0.877, lean: 2.56 },
      female: { fat: 1.121, lean: 1.813 },
    },
    thigh: {
      male: { fat: 0.923, lean: 2.299 },
      female: { fat: 0.925, lean: 2.337 },
    },
    calf: {
      male: { fat: 0.949, lean: 2.187 },
      female: { fat: 0.936, lean: 2.264 },
    },
  };

  /**
   * The NHANES site whose fat and lean split each ANSUR II girth takes. Waist, buttock, upper arm, thigh and calf take their own sites (the navel waist the iliac crest waist, the buttock the hip, the lower thigh the mid-thigh). The chest takes the hip's mixed split, since pectoral and back muscle and fat both fill it; the neck and wrist the arm's, the ankle the calf's. Grade: conventional for the chest, neck, wrist and ankle.
   */
  export const SPLIT_SITE: Record<
    keyof typeof ANSUR_II,
    keyof typeof COMPOSITION_SPLIT
  > = {
    neck: "arm",
    chest: "hip",
    waist: "waist",
    buttock: "hip",
    biceps: "arm",
    wrist: "arm",
    thigh: "thigh",
    lowerThigh: "thigh",
    calf: "calf",
    ankle: "calf",
  };

  /** Ages bounding the ANSUR II sample, years; the regressions are read inside them. */
  export const ANSUR_AGES: [number, number] = [17, 58];
}
