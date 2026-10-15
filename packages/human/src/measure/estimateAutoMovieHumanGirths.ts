import { AutoMovieHumanSex } from "../structures/AutoMovieHumanSex";
import { IAutoMovieHumanIdentity } from "../structures/IAutoMovieHumanIdentity";
import { IAutoMovieHumanConversionContext } from "./IAutoMovieHumanConversionContext";
import { IAutoMovieHumanGrowthCurve } from "./IAutoMovieHumanGrowthCurve";
import { estimateAutoMovieHumanMedianStature } from "./estimateAutoMovieHumanMedianStature";
import { interpolateAutoMovieHumanGrowthCurve } from "./interpolateAutoMovieHumanGrowthCurve";

/** A curve for each sex. */
type ISexCurve = Record<AutoMovieHumanSex, IAutoMovieHumanGrowthCurve>;

/**
 * A girth regression `intercept + stature·S + bmi·B + age·a`, millimetres, with stature in millimetres, body mass index in kilograms per square metre and age in years.
 */
interface IRegression {
  intercept: number;
  stature: number;
  bmi: number;
  age: number;
}

/**
 * Adult girths, our ordinary least squares fits per sex on the public ANSUR II working databases (Gordon et al. 2014, NATICK/TR-15/007; Paquette and Parham 2017), 1,986 women and 4,082 men aged 17 to 58, on stature, BMI and age. Waist is ANSUR's navel waist, used only to carry the natural waist's response; biceps is the flexed girth, whose stature and BMI slopes stand in for the relaxed upper arm. Valid within about 1,400 to 2,000 mm stature, BMI 17 to 40 and age 17 to 58. Grade: population-fitted.
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
    female: { intercept: 101.6, stature: 0.0766, bmi: 3.83, age: 0.2 },
    male: { intercept: 124.8, stature: 0.0732, bmi: 4.91, age: 0.28 },
  },
  chest: {
    female: { intercept: -16.6, stature: 0.2773, bmi: 18.68, age: 1.23 },
    male: { intercept: -46.5, stature: 0.3149, bmi: 18.79, age: 1.06 },
  },
  waist: {
    female: { intercept: -237.0, stature: 0.2855, bmi: 23.56, age: 1.12 },
    male: { intercept: -366.9, stature: 0.3389, bmi: 23.63, age: 1.93 },
  },
  buttock: {
    female: { intercept: -88.5, stature: 0.3939, bmi: 18.32, age: 0.05 },
    male: { intercept: -96.6, stature: 0.377, bmi: 16.96, age: -0.52 },
  },
  biceps: {
    female: { intercept: -46.9, stature: 0.0965, bmi: 7.45, age: 0.19 },
    male: { intercept: -3.1, stature: 0.0958, bmi: 7.06, age: -0.08 },
  },
  wrist: {
    female: { intercept: 24.7, stature: 0.0629, bmi: 1.16, age: -0.07 },
    male: { intercept: 28.7, stature: 0.0639, bmi: 1.22, age: 0.04 },
  },
  thigh: {
    female: { intercept: -113.1, stature: 0.2348, bmi: 13.87, age: -0.23 },
    male: { intercept: -94.6, stature: 0.2146, bmi: 13.37, age: -0.91 },
  },
  lowerThigh: {
    female: { intercept: -45.2, stature: 0.1538, bmi: 8.0, age: -0.3 },
    male: { intercept: -11.8, stature: 0.1383, bmi: 6.75, age: -0.29 },
  },
  calf: {
    female: { intercept: 7.8, stature: 0.1347, bmi: 6.2, age: -0.41 },
    male: { intercept: 33.3, stature: 0.114, bmi: 6.06, age: -0.3 },
  },
  ankle: {
    female: { intercept: 38.9, stature: 0.0792, bmi: 2.34, age: -0.41 },
    male: { intercept: 34.7, stature: 0.0779, bmi: 2.5, age: -0.38 },
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
      ages: [2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5, 11.5, 12.5, 13.5, 14.5, 15.5, 16.5, 17.75],
      values: [115, 114, 118, 119, 124, 126, 128, 132, 136, 138, 146, 151, 156, 162, 170, 171],
    },
    female: {
      ages: [2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5, 11.5, 12.5, 13.5, 14.5, 15.5, 16.5, 17.75],
      values: [112, 112, 117, 120, 120, 127, 133, 133, 135, 140, 144, 146, 149, 153, 151, 149],
    },
  },
  thigh: {
    male: {
      ages: [2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5, 11.5, 12.5, 13.5, 14.5, 15.5, 16.5, 17.75],
      values: [282, 296, 312, 325, 344, 363, 382, 407, 425, 437, 455, 477, 497, 519, 538, 554],
    },
    female: {
      ages: [2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5, 11.5, 12.5, 13.5, 14.5, 15.5, 16.5, 17.75],
      values: [287, 306, 325, 343, 356, 382, 404, 422, 439, 464, 483, 498, 527, 538, 545, 543],
    },
  },
  calf: {
    male: {
      ages: [2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5, 11.5, 12.5, 13.5, 14.5, 15.5, 16.5, 17.75],
      values: [204, 208, 218, 224, 237, 249, 262, 273, 284, 291, 305, 321, 331, 349, 359, 365],
    },
    female: {
      ages: [2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5, 11.5, 12.5, 13.5, 14.5, 15.5, 16.5, 17.75],
      values: [202, 209, 218, 227, 236, 247, 262, 271, 282, 295, 306, 314, 329, 335, 339, 338],
    },
  },
  ankle: {
    male: {
      ages: [2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5, 11.5, 12.5, 13.5, 14.5, 15.5, 16.5, 17.75],
      values: [150, 148, 155, 155, 163, 167, 173, 181, 182, 189, 203, 209, 212, 219, 227, 227],
    },
    female: {
      ages: [2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5, 11.5, 12.5, 13.5, 14.5, 15.5, 16.5, 17.75],
      values: [147, 146, 154, 158, 162, 172, 181, 183, 186, 193, 199, 206, 209, 212, 212, 208],
    },
  },
};

/**
 * How fat and limb lean mass each move a girth, as multiples of the girth's own BMI slope: our ordinary least squares fits of NHANES girths on stature, the DXA fat mass index and the appendicular lean mass index, adults 18 to 40 (2017-2018 cycle for the waist at the iliac crest, hip and relaxed mid-upper arm, 657 to 661 women and 635 to 636 men; 1999-2004 cycles, first imputation, for the mid-thigh and the calf, 1,903 to 1,913 women and 2,086 to 2,097 men; National Center for Health Statistics public-use files DXX, BMX and DEMO), each slope over the same girth's slope on BMI at fixed stature. R² 0.82 to 0.94. A unit of fat mass index thickens the waist 1.6 times as much as a unit of BMI does in men while a unit of limb lean mass thickens it 0.64 times; at the arm it is 0.85 and 2.6 times: fat goes to the trunk, lean to the limbs and the shoulders. In the population a unit of BMI carries about 0.53 to 0.65 units of fat mass index and 0.17 to 0.21 of limb lean mass index, which these factors return. Grade: population-fitted.
 */
const COMPOSITION_SPLIT: Record<
  "waist" | "hip" | "arm" | "thigh" | "calf",
  Record<AutoMovieHumanSex, { fat: number; lean: number }>
> = {
  waist: { male: { fat: 1.6, lean: 0.64 }, female: { fat: 1.388, lean: 0.82 } },
  hip: { male: { fat: 1.362, lean: 1.312 }, female: { fat: 1.376, lean: 0.916 } },
  arm: { male: { fat: 0.854, lean: 2.612 }, female: { fat: 1.104, lean: 1.885 } },
  thigh: { male: { fat: 0.889, lean: 2.396 }, female: { fat: 0.909, lean: 2.381 } },
  calf: { male: { fat: 0.937, lean: 2.218 }, female: { fat: 0.92, lean: 2.316 } },
};

/**
 * The NHANES site whose fat and lean split each ANSUR II girth takes. Waist, buttock, upper arm, thigh and calf take their own sites (the navel waist the iliac crest waist, the buttock the hip, the lower thigh the mid-thigh). The chest takes the hip's mixed split, since pectoral and back muscle and fat both fill it; the neck and wrist the arm's, the ankle the calf's. Grade: conventional for the chest, neck, wrist and ankle.
 */
const SPLIT_SITE: Record<keyof typeof ANSUR_II, keyof typeof COMPOSITION_SPLIT> = {
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
 * Adults take our ANSUR II regressions on stature, BMI and age at the median person's BMI, and the person's fat and limb lean mass then reach each girth by its own measured slope (waist 23.6 mm per BMI unit, ankle 2.4) split between fat and lean as NHANES DXA measures them, so fat widens the waist and lean mass the arms, thighs and shoulders. ANSUR II measures the waist only at the navel, so the natural, narrowest waist comes from the navel waist and the buttock girth by the 1988 Army survey's relation between the two waists, which keeps adiposity's and age's own reach into the waist. The relaxed upper arm takes the NHANES mean for age with the ANSUR flexed-biceps slopes for stature and BMI. Past 58, the edge of the ANSUR sample, limb girths follow the NHANES arm girth's decline and the waist the NHANES waist's course, while the other girths hold.
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
  const sampleAge: number = Math.min(ANSUR_AGES[1], Math.max(ANSUR_AGES[0], atAge));
  // ANSUR II at the median person's BMI, then fat and limb lean mass each by their own reach
  const referenceBmi: number = context.bmi - context.bmiOffset;
  const composed: (key: keyof typeof ANSUR_II) => number = (
    key: keyof typeof ANSUR_II,
  ): number => {
    const split: { fat: number; lean: number } =
      COMPOSITION_SPLIT[SPLIT_SITE[key]][sex];
    return (
      ANSUR_II[key][sex].bmi *
      (split.fat * context.fatIndexOffset + split.lean * context.leanIndexOffset)
    );
  };
  const fit: (key: keyof typeof ANSUR_II) => number = (
    key: keyof typeof ANSUR_II,
  ): number => {
    const r: IRegression = ANSUR_II[key][sex];
    return (
      r.intercept +
      r.stature * stature +
      r.bmi * referenceBmi +
      r.age * sampleAge +
      composed(key)
    );
  };
  const late: number = ANSUR_AGES[1];
  const limbAgeing: number =
    atAge > late ? read(NHANES_ARM, atAge) / read(NHANES_ARM, late) : 1;
  const waistAgeing: number =
    atAge > late ? read(NHANES_WAIST, atAge) / read(NHANES_WAIST, late) : 1;

  // natural waist: the 1988 survey's relation to the navel waist and the buttock girth
  const natural: { intercept: number; navel: number; buttock: number } =
    NATURAL_WAIST[sex];
  const buttock: number = fit("buttock");
  const biceps: IRegression = ANSUR_II.biceps[sex];
  const upperArm: number =
    read(NHANES_ARM, atAge) +
    biceps.stature * (stature - estimateAutoMovieHumanMedianStature(sex, atAge)) +
    biceps.bmi * (referenceBmi - NHANES_ADULT_BMI) +
    composed("biceps");
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
