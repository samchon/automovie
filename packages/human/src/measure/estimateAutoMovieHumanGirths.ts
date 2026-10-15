import { AutoMovieHumanSex } from "../structures/AutoMovieHumanSex";
import { IAutoMovieHumanIdentity } from "../structures/IAutoMovieHumanIdentity";
import { IAutoMovieHumanConversionContext } from "./IAutoMovieHumanConversionContext";
import { IAutoMovieHumanGrowthCurve } from "./IAutoMovieHumanGrowthCurve";
import { estimateAutoMovieHumanMedianStature } from "./estimateAutoMovieHumanMedianStature";
import { interpolateAutoMovieHumanGrowthCurve } from "./interpolateAutoMovieHumanGrowthCurve";

/** A curve for each sex. */
type ISexCurve = Record<AutoMovieHumanSex, IAutoMovieHumanGrowthCurve>;

/**
 * A girth regression in cross-sectional area, `girth² = stature · (area + bmi·B + age·a)`, millimetres, with stature in millimetres, body mass index in kilograms per square metre and age in years.
 *
 * A cross-section's area is the tissue a unit of the body's length holds, and that tissue is a mass index times stature: so at a given BMI and composition a girth grows as the square root of stature, while composition adds area rather than girth.
 */
interface IRegression {
  area: number;
  bmi: number;
  age: number;
}

/**
 * Adult girths, our least squares fits per sex of `girth² / stature` on BMI and age over the public ANSUR II working databases (Gordon et al. 2014, NATICK/TR-15/007; Paquette and Parham 2017), 1,986 women and 4,082 men aged 17 to 58. Waist is ANSUR's navel waist, used only to carry the natural waist's response; biceps is the flexed girth, whose stature and BMI response stands in for the relaxed upper arm. R² is within 0.016 of girths linear in stature, BMI and age (0.42 to 0.88). In the sample's tall, slim corner (BMI under 20.5 and the tallest quarter; 20 women, 28 men), where linear girths add the population's millimetres per millimetre of stature to a slim person as to a heavy one, the linear fits came out 10 to 17 mm too wide at the buttock and thigh and these within 2, except 11 mm narrow at men's buttock; at the navel waist and chest these fall 10 to 23 mm short there, and over all ten girths they miss the corner by 6 to 7 mm against the linear fits' 7 to 8. Valid within about 1,400 to 2,000 mm stature, BMI 16 to 40 and age 17 to 58. Grade: population-fitted.
 */
const ANSUR_II: Record<
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

/**
 * Mean waist circumference at the iliac crest, millimetres, of the 2015-2018 US NHANES (Fryar et al. 2021, Vital Health Stat 3(46), Tables 18, 19 and 20), at the centres of its one-year child ages and ten-year adult groups. Read only as a ratio between ages: it carries how trunk girths grow in children and change in old age. Grade: measured.
 */
const NHANES_WAIST: ISexCurve = {
  male: {
    ages: [2.5, 5.5, 10.5, 15.5, 19.5, 25, 35, 45, 55, 65, 75, 85],
    values: [488, 550, 704, 850, 895, 942, 1026, 1041, 1051, 1073, 1074, 1043],
  },
  female: {
    ages: [2.5, 5.5, 10.5, 15.5, 19.5, 25, 35, 45, 55, 65, 75, 85],
    values: [480, 559, 700, 804, 880, 921, 972, 995, 998, 1017, 1015, 983],
  },
};

/**
 * Mean relaxed mid-upper arm circumference, millimetres, of the same NHANES report (Tables 21, 22 and 23), the first sample at 2 to 5 months. It is the upper arm girth itself, and its ratio between ages carries how the other limb girths grow and thin. Grade: measured.
 */
const NHANES_ARM: ISexCurve = {
  male: {
    ages: [0.29, 1.5, 5.5, 10.5, 15.5, 19.5, 25, 35, 45, 55, 65, 75, 85],
    values: [140, 157, 180, 236, 300, 325, 341, 359, 356, 348, 344, 332, 308],
  },
  female: {
    ages: [0.29, 1.5, 5.5, 10.5, 15.5, 19.5, 25, 35, 45, 55, 65, 75, 85],
    values: [136, 154, 185, 236, 278, 306, 315, 328, 333, 328, 324, 320, 296],
  },
};

/** Mean BMI of the NHANES 2015-2018 adults the arm girth means describe, kilograms per square metre, as the report's tables give it to the nearest unit. */
const NHANES_ADULT_BMI: number = 29;

/**
 * Natural (narrowest) waist over hip circumference, the 1977 US child survey's means of per-subject ratios at its one-year bin centres (Snyder et al. 1977, UM-HSRI-77-17; individual records published by NIST as AnthroKids), fitted by us. Girls fall from 0.92 to 0.72 as the pelvis and hips widen at puberty, boys only to about 0.85. Grade: population-fitted.
 */
const NATURAL_WAIST_TO_HIP: ISexCurve = {
  male: {
    ages: [2.5, 4.5, 6.5, 8.5, 10.5, 12.5, 14.5, 16.5, 17.75],
    values: [0.908, 0.921, 0.888, 0.878, 0.874, 0.867, 0.861, 0.839, 0.848],
  },
  female: {
    ages: [2.5, 4.5, 6.5, 8.5, 10.5, 12.5, 14.5, 16.5, 17.75],
    values: [0.92, 0.9, 0.854, 0.834, 0.81, 0.766, 0.736, 0.732, 0.717],
  },
};

/**
 * Natural waist from the navel waist and the buttock circumference, `intercept + navel·N + buttock·B`, millimetres: our ordinary least squares fits per sex on the public records of the 1988 US Army survey (Gordon et al. 1989, NATICK/TR-89/044; 2,208 women and 1,774 men, records published by the Penn State OpenLab), the last Army survey to measure both waists. Its natural waist is the horizontal girth "at the level of the greatest indentation" of the right side of the torso, or midway between the tenth rib and iliocristale where no single indentation is clear, at quiet respiration; the navel waist is ANSUR II's own omphalion definition. R² 0.80 and residual standard deviation 28.1 mm in women, 0.92 and 21.1 mm in men. The sample means give a natural waist-to-hip ratio of 0.750 (SD 0.043) in women and 0.853 (0.042) in men. Grade: population-fitted.
 */
const NATURAL_WAIST: Record<
  AutoMovieHumanSex,
  { intercept: number; navel: number; buttock: number }
> = {
  female: { intercept: 83.76, navel: 0.569, buttock: 0.1978 },
  male: { intercept: 106.84, navel: 0.7868, buttock: 0.0554 },
};

/**
 * Relaxed maximum forearm girth from the relaxed upper arm and the wrist girths, `intercept + upperArm·U + wrist·W`, millimetres: our ordinary least squares fits per sex on the 1977 US child survey's individual records (Snyder et al. 1977, UM-HSRI-77-17; NIST AnthroKids), 670 boys and 641 girls aged 2 to 18.5, all three girths taken standing with the arms hanging, the forearm "the maximum circumference ... perpendicular to the long axis of the limb", the wrist the minimum above the ulnar styloid. R² 0.965 and 0.953, residual standard deviations 7.5 and 6.5 mm. ANSUR II measures only a flexed forearm girth, across the elbow crease with the fist clenched (Gordon et al. 2014), which is not the relaxed limb the identity describes. Adults extend the relation past 18.5 years, where no relaxed forearm girth was read; within the 16-to-18.5-year records alone it predicts the same adult forearms within 1%. Grade: population-fitted.
 */
const RELAXED_FOREARM: Record<
  AutoMovieHumanSex,
  { intercept: number; upperArm: number; wrist: number }
> = {
  female: { intercept: 8.18, upperArm: 0.5129, wrist: 0.6143 },
  male: { intercept: 0.82, upperArm: 0.5416, wrist: 0.6536 },
};

/**
 * Mean relaxed limb girths by age, millimetres, from the 1977 US child survey's individual records (Snyder et al. 1977, UM-HSRI-77-17; NIST AnthroKids), our means at the centres of one-year bins (the last spanning 17 to 18.5 years; 12 to 157 children per bin), all standing: the wrist the minimum above the ulnar styloid, the thigh horizontal at the gluteal furrow, the calf the maximum and the ankle the minimum above the malleoli. Read only as ratios between ages, they carry how each girth grows: the wrist and ankle grow far less than the arm through childhood (wrist 112 to 149 mm in girls against an upper arm of 156 to 248), so scaling them by the arm's growth would make a child's wrist and ankle too thin. Grade: measured.
 */
const SNYDER_LIMB: Record<"wrist" | "thigh" | "calf" | "ankle", ISexCurve> = {
  wrist: {
    male: {
      ages: [
        2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5, 11.5, 12.5, 13.5, 14.5,
        15.5, 16.5, 17.75,
      ],
      values: [
        115, 114, 118, 119, 124, 126, 128, 132, 136, 138, 146, 151, 156, 162,
        170, 171,
      ],
    },
    female: {
      ages: [
        2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5, 11.5, 12.5, 13.5, 14.5,
        15.5, 16.5, 17.75,
      ],
      values: [
        112, 112, 117, 120, 120, 127, 133, 133, 135, 140, 144, 146, 149, 153,
        151, 149,
      ],
    },
  },
  thigh: {
    male: {
      ages: [
        2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5, 11.5, 12.5, 13.5, 14.5,
        15.5, 16.5, 17.75,
      ],
      values: [
        282, 296, 312, 325, 344, 363, 382, 407, 425, 437, 455, 477, 497, 519,
        538, 554,
      ],
    },
    female: {
      ages: [
        2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5, 11.5, 12.5, 13.5, 14.5,
        15.5, 16.5, 17.75,
      ],
      values: [
        287, 306, 325, 343, 356, 382, 404, 422, 439, 464, 483, 498, 527, 538,
        545, 543,
      ],
    },
  },
  calf: {
    male: {
      ages: [
        2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5, 11.5, 12.5, 13.5, 14.5,
        15.5, 16.5, 17.75,
      ],
      values: [
        204, 208, 218, 224, 237, 249, 262, 273, 284, 291, 305, 321, 331, 349,
        359, 365,
      ],
    },
    female: {
      ages: [
        2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5, 11.5, 12.5, 13.5, 14.5,
        15.5, 16.5, 17.75,
      ],
      values: [
        202, 209, 218, 227, 236, 247, 262, 271, 282, 295, 306, 314, 329, 335,
        339, 338,
      ],
    },
  },
  ankle: {
    male: {
      ages: [
        2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5, 11.5, 12.5, 13.5, 14.5,
        15.5, 16.5, 17.75,
      ],
      values: [
        150, 148, 155, 155, 163, 167, 173, 181, 182, 189, 203, 209, 212, 219,
        227, 227,
      ],
    },
    female: {
      ages: [
        2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5, 11.5, 12.5, 13.5, 14.5,
        15.5, 16.5, 17.75,
      ],
      values: [
        147, 146, 154, 158, 162, 172, 181, 183, 186, 193, 199, 206, 209, 212,
        212, 208,
      ],
    },
  },
};

/**
 * How fat and limb lean mass each move a girth, as multiples of the girth's own response to BMI: our least squares fits of `girth² / stature` of NHANES adults 18 to 40 on the DXA fat mass index and the appendicular lean mass index (2017-2018 cycle for the waist at the iliac crest, hip and relaxed mid-upper arm, 657 to 661 women and 635 to 636 men; 1999-2004 cycles, first imputation, for the mid-thigh and the calf, 1,903 to 1,913 women and 2,086 to 2,097 men; National Center for Health Statistics public-use files DXX, BMX and DEMO), each coefficient over the same girth's coefficient on BMI, the form of {@link ANSUR_II}. R² 0.82 to 0.93. Among NHANES's tall, lean adults (the leanest quarter by fat mass index and the tallest 40%; 74 to 237 per site and sex) girths linear in stature, fat mass index and limb lean mass index came out 10 to 19 mm too wide at the iliac crest waist and 1 to 7 mm at the hip, arm and thigh, and these within 6 except 21 mm narrow at women's hip. A unit of fat mass index adds 1.6 times the area a unit of BMI adds at a man's waist while a unit of limb lean mass adds 0.61 times; at the arm it is 0.88 and 2.6 times: fat goes to the trunk, lean to the limbs and the shoulders. In the population a unit of BMI carries about 0.53 to 0.65 units of fat mass index and 0.17 to 0.21 of limb lean mass index, which these factors return within 2%. Grade: population-fitted.
 */
const COMPOSITION_SPLIT: Record<
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
const SPLIT_SITE: Record<
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
const ANSUR_AGES: [number, number] = [17, 58];

/** Ages over which the child scaling hands over to the adult fits, years. */
const ADULT_FROM: [number, number] = [17.75, 20];

/** Age whose adult girths the child scaling starts from, the last NHANES child sample, years. */
const REFERENCE_AGE: number = 19.5;

/**
 * Girths of one person.
 *
 * Adults take our ANSUR II regressions of cross-sectional area on stature, BMI and age, read at the median person's BMI moved by the person's fat and limb lean mass, each by its share of the girth's own response to BMI as NHANES DXA measures it, so fat widens the waist and lean mass the arms, thighs and shoulders, and a tall, slim person's girths grow with stature only as far as their own tissue does. ANSUR II measures the waist only at the navel, so the natural, narrowest waist comes from the navel waist and the buttock girth by the 1988 Army survey's relation between the two waists, which keeps adiposity's and age's own reach into the waist. The relaxed upper arm takes the NHANES mean for age, scaled by the ANSUR flexed-biceps regression from the NHANES mean person to this one. Past 58, the edge of the ANSUR sample, limb girths follow the NHANES arm girth's decline and the waist the NHANES waist's course, while the other girths hold.
 *
 * Children take the adult girths at 19.5 years for the same BMI and scale them by stature over the median stature for age and by the growth of the NHANES waist (chest and buttock), the NHANES upper arm (upper arm and neck) or the girth's own 1977 course (wrist, thigh, lower thigh, calf and ankle). The forearm is a relaxed girth at every age, from the relaxed upper arm and wrist by the 1977 survey's relation; ANSUR II measures only a flexed forearm. No child neck girth was read; it follows the arm girth, which NHANES measured from 2 months, rather than the waist, which it measured only from 2 years; their natural waist is the 1977 survey's natural-waist-to-hip ratio for age. Below 2.5 years, where NHANES measured no waist, trunk girths follow median stature. Between 17.75 and 20 years the two hand over linearly. Population is not read.
 *
 * @param context Resolved person
 * @returns Body girths and the girths of one arm and one leg
 */
export function estimateAutoMovieHumanGirths(
  context: IAutoMovieHumanConversionContext,
): estimateAutoMovieHumanGirths.IOutput {
  const { sex, age }: IAutoMovieHumanConversionContext = context;
  const read: (curve: ISexCurve, at: number) => number = (
    curve: ISexCurve,
    at: number,
  ): number => interpolateAutoMovieHumanGrowthCurve(curve[sex], at);
  const adult: (atAge: number, stature: number) => IGirths = (
    atAge: number,
    stature: number,
  ): IGirths => adultGirths(context, atAge, stature, read);
  const weight: number = Math.min(
    1,
    Math.max(0, (age - ADULT_FROM[0]) / (ADULT_FROM[1] - ADULT_FROM[0])),
  );
  const grown: IGirths | null =
    weight === 0 ? null : adult(age, context.peakStature);
  const child: IGirths | null =
    weight === 1 ? null : childGirths(context, adult, read);
  const girth: (key: keyof IGirths) => number = (key: keyof IGirths): number =>
    child === null
      ? grown![key]
      : grown === null
        ? child[key]
        : (1 - weight) * child[key] + weight * grown[key];
  return {
    neckCircumference: girth("neck"),
    chestCircumference: girth("chest"),
    waistCircumference: girth("naturalWaist"),
    buttockCircumference: girth("buttock"),
    arm: {
      upperArmCircumference: girth("upperArm"),
      forearmCircumference: girth("forearm"),
      wristCircumference: girth("wrist"),
    },
    leg: {
      thighCircumference: girth("thigh"),
      lowerThighCircumference: girth("lowerThigh"),
      calfCircumference: girth("calf"),
      ankleCircumference: girth("ankle"),
    },
  };
}
/** Output type of {@link estimateAutoMovieHumanGirths}. */
export namespace estimateAutoMovieHumanGirths {
  /**
   * Girths of one person, millimetres.
   *
   * @author Samchon
   */
  export interface IOutput {
    /** Neck circumference. */
    neckCircumference: number;

    /** Chest circumference. */
    chestCircumference: number;

    /** Natural waist circumference. */
    waistCircumference: number;

    /** Buttock circumference. */
    buttockCircumference: number;

    /** Girths of one arm. */
    arm: Pick<
      IAutoMovieHumanIdentity.IArm,
      "upperArmCircumference" | "forearmCircumference" | "wristCircumference"
    >;

    /** Girths of one leg. */
    leg: Pick<
      IAutoMovieHumanIdentity.ILeg,
      | "thighCircumference"
      | "lowerThighCircumference"
      | "calfCircumference"
      | "ankleCircumference"
    >;
  }
}

/** Every girth the estimator resolves, millimetres. */
interface IGirths {
  neck: number;
  chest: number;
  naturalWaist: number;
  buttock: number;
  upperArm: number;
  forearm: number;
  wrist: number;
  thigh: number;
  lowerThigh: number;
  calf: number;
  ankle: number;
}

/**
 * Adult girths at an age and stature for the context's BMI.
 *
 * @param context Resolved person
 * @param atAge Age in years
 * @param stature Stature the regressions read, millimetres
 * @param read Curve reader for the context's sex
 * @returns Girths in millimetres
 */
function adultGirths(
  context: IAutoMovieHumanConversionContext,
  atAge: number,
  stature: number,
  read: (curve: ISexCurve, at: number) => number,
): IGirths {
  const sex: AutoMovieHumanSex = context.sex;
  const sampleAge: number = Math.min(
    ANSUR_AGES[1],
    Math.max(ANSUR_AGES[0], atAge),
  );
  // ANSUR II at the median person's BMI, moved by fat and limb lean mass each by their own reach
  const referenceBmi: number = context.bmi - context.bmiOffset;
  const composed: (key: keyof typeof ANSUR_II) => number = (
    key: keyof typeof ANSUR_II,
  ): number => {
    const split: { fat: number; lean: number } =
      COMPOSITION_SPLIT[SPLIT_SITE[key]][sex];
    return (
      referenceBmi +
      split.fat * context.fatIndexOffset +
      split.lean * context.leanIndexOffset
    );
  };
  const area: (
    key: keyof typeof ANSUR_II,
    atStature: number,
    bmi: number,
  ) => number = (
    key: keyof typeof ANSUR_II,
    atStature: number,
    bmi: number,
  ): number => {
    const r: IRegression = ANSUR_II[key][sex];
    return atStature * (r.area + r.bmi * bmi + r.age * sampleAge);
  };
  const fit: (key: keyof typeof ANSUR_II) => number = (
    key: keyof typeof ANSUR_II,
  ): number => Math.sqrt(area(key, stature, composed(key)));
  const late: number = ANSUR_AGES[1];
  const limbAgeing: number =
    atAge > late ? read(NHANES_ARM, atAge) / read(NHANES_ARM, late) : 1;
  const waistAgeing: number =
    atAge > late ? read(NHANES_WAIST, atAge) / read(NHANES_WAIST, late) : 1;

  // natural waist: the 1988 survey's relation to the navel waist and the buttock girth
  const natural: { intercept: number; navel: number; buttock: number } =
    NATURAL_WAIST[sex];
  const buttock: number = fit("buttock");
  const upperArm: number =
    read(NHANES_ARM, atAge) *
    Math.sqrt(
      area("biceps", stature, composed("biceps")) /
        area(
          "biceps",
          estimateAutoMovieHumanMedianStature(sex, atAge),
          NHANES_ADULT_BMI,
        ),
    );
  const wrist: number = fit("wrist") * limbAgeing;
  return {
    neck: fit("neck"),
    chest: fit("chest"),
    naturalWaist:
      natural.intercept +
      natural.navel * fit("waist") * waistAgeing +
      natural.buttock * buttock,
    buttock,
    upperArm,
    forearm: relaxedForearm(sex, upperArm, wrist),
    wrist,
    thigh: fit("thigh") * limbAgeing,
    lowerThigh: fit("lowerThigh") * limbAgeing,
    calf: fit("calf") * limbAgeing,
    ankle: fit("ankle") * limbAgeing,
  };
}

/**
 * Child girths: the adult girths at the reference age scaled by stature over the median for age and by a growth ratio: the NHANES waist's for the trunk, the NHANES upper arm's for the upper arm and neck, and the 1977 survey's own girth for the wrist, thigh, calf and ankle; the lower thigh follows the thigh, and the forearm comes from the upper arm and wrist.
 *
 * @param context Resolved person
 * @param adult Adult girths at an age and stature
 * @param read Curve reader for the context's sex
 * @returns Girths in millimetres
 */
function childGirths(
  context: IAutoMovieHumanConversionContext,
  adult: (atAge: number, stature: number) => IGirths,
  read: (curve: ISexCurve, at: number) => number,
): IGirths {
  const { sex, age }: IAutoMovieHumanConversionContext = context;
  const reference: IGirths = adult(
    REFERENCE_AGE,
    estimateAutoMovieHumanMedianStature(sex, REFERENCE_AGE),
  );
  const firstWaist: number = NHANES_WAIST[sex].ages[0]!;
  const trunkGrowth: number =
    (age < firstWaist
      ? (read(NHANES_WAIST, firstWaist) *
          estimateAutoMovieHumanMedianStature(sex, age)) /
        estimateAutoMovieHumanMedianStature(sex, firstWaist)
      : read(NHANES_WAIST, age)) / read(NHANES_WAIST, REFERENCE_AGE);
  const limbGrowth: number =
    read(NHANES_ARM, age) / read(NHANES_ARM, REFERENCE_AGE);
  const tall: number = context.stature / context.medianStature;
  const trunk: number = trunkGrowth * tall;
  const limb: number = limbGrowth * tall;
  // each girth the 1977 survey measured grows by its own course; below its first bin, by the arm's
  const own: (key: keyof typeof SNYDER_LIMB) => number = (
    key: keyof typeof SNYDER_LIMB,
  ): number => {
    const curve: ISexCurve = SNYDER_LIMB[key];
    const first: number = curve[sex].ages[0]!;
    const last: number = curve[sex].ages[curve[sex].ages.length - 1]!;
    const infancy: number =
      age < first ? read(NHANES_ARM, age) / read(NHANES_ARM, first) : 1;
    return ((read(curve, age) * infancy) / read(curve, last)) * tall;
  };
  const buttock: number = reference.buttock * trunk;
  const upperArm: number = reference.upperArm * limb;
  const wrist: number = reference.wrist * own("wrist");
  const thigh: number = own("thigh");
  return {
    neck: reference.neck * limb,
    chest: reference.chest * trunk,
    naturalWaist: read(NATURAL_WAIST_TO_HIP, age) * buttock,
    buttock,
    upperArm,
    forearm: relaxedForearm(sex, upperArm, wrist),
    wrist,
    thigh: reference.thigh * thigh,
    lowerThigh: reference.lowerThigh * thigh,
    calf: reference.calf * own("calf"),
    ankle: reference.ankle * own("ankle"),
  };
}

/**
 * Relaxed forearm girth from the relaxed upper arm and wrist girths by {@link RELAXED_FOREARM}.
 *
 * @param sex Which sex's fit to read
 * @param upperArm Relaxed upper arm circumference, millimetres
 * @param wrist Wrist circumference, millimetres
 * @returns Relaxed maximum forearm circumference, millimetres
 */
function relaxedForearm(
  sex: AutoMovieHumanSex,
  upperArm: number,
  wrist: number,
): number {
  const r: { intercept: number; upperArm: number; wrist: number } =
    RELAXED_FOREARM[sex];
  return r.intercept + r.upperArm * upperArm + r.wrist * wrist;
}
