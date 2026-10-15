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
 * Adult girths, our ordinary least squares fits per sex on the public ANSUR II working databases (Gordon et al. 2014, NATICK/TR-15/007; Paquette and Parham 2017), 1,986 women and 4,082 men aged 17 to 58, on stature, BMI and age. Waist is ANSUR's navel waist, used only to carry the natural waist's response; biceps is the flexed girth, whose stature and BMI slopes stand in for the relaxed upper arm; forearm is the flexed girth at the elbow crease. Valid within about 1,400 to 2,000 mm stature, BMI 17 to 40 and age 17 to 58. Grade: population-fitted.
 */
const ANSUR_II: Record<
  | "neck"
  | "chest"
  | "waist"
  | "buttock"
  | "biceps"
  | "forearm"
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
  forearm: {
    female: { intercept: 16.0, stature: 0.0913, bmi: 4.0, age: -0.09 },
    male: { intercept: 26.9, stature: 0.0962, bmi: 4.07, age: 0.05 },
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

/** Ages bounding the ANSUR II sample, years; the regressions are read inside them. */
const ANSUR_AGES: [number, number] = [17, 58];

/** Ages over which the child scaling hands over to the adult fits, years. */
const ADULT_FROM: [number, number] = [17.75, 20];

/** Age whose adult girths the child scaling starts from, the last NHANES child sample, years. */
const REFERENCE_AGE: number = 19.5;

/**
 * Girths of one person.
 *
 * Adults take our ANSUR II regressions on stature, BMI and age, so adiposity reaches each girth by its own measured slope (waist 23.6 mm per BMI unit, ankle 2.4). ANSUR II measures the waist only at the navel, so the natural, narrowest waist comes from the navel waist and the buttock girth by the 1988 Army survey's relation between the two waists, which keeps adiposity's and age's own reach into the waist. The relaxed upper arm takes the NHANES mean for age with the ANSUR flexed-biceps slopes for stature and BMI. Past 58, the edge of the ANSUR sample, limb girths follow the NHANES arm girth's decline and the waist the NHANES waist's course, while the other girths hold.
 *
 * Children take the adult girths at 19.5 years for the same BMI and scale them by the NHANES growth of the waist (chest and buttock) or of the upper arm (limbs and neck) and by stature over the median stature for age. No child neck girth was read; it follows the arm girth, which NHANES measured from 2 months, rather than the waist, which it measured only from 2 years; their natural waist is the 1977 survey's natural-waist-to-hip ratio for age. Below 2.5 years, where NHANES measured no waist, trunk girths follow median stature. Between 17.75 and 20 years the two hand over linearly. Population is not read.
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
  const fit: (
    key: keyof typeof ANSUR_II,
    bmi?: number,
    age?: number,
  ) => number = (
    key: keyof typeof ANSUR_II,
    bmi: number = context.bmi,
    age: number = sampleAge,
  ): number => {
    const r: IRegression = ANSUR_II[key][sex];
    return r.intercept + r.stature * stature + r.bmi * bmi + r.age * age;
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
  return {
    neck: fit("neck"),
    chest: fit("chest"),
    naturalWaist:
      natural.intercept +
      natural.navel * fit("waist") * waistAgeing +
      natural.buttock * buttock,
    buttock,
    upperArm:
      read(NHANES_ARM, atAge) +
      biceps.stature *
        (stature - estimateAutoMovieHumanMedianStature(sex, atAge)) +
      biceps.bmi * (context.bmi - NHANES_ADULT_BMI),
    forearm: fit("forearm") * limbAgeing,
    wrist: fit("wrist") * limbAgeing,
    thigh: fit("thigh") * limbAgeing,
    lowerThigh: fit("lowerThigh") * limbAgeing,
    calf: fit("calf") * limbAgeing,
    ankle: fit("ankle") * limbAgeing,
  };
}

/**
 * Child girths: the adult girths at the reference age scaled by the NHANES growth of the waist or the upper arm and by stature over the median for age.
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
  const buttock: number = reference.buttock * trunk;
  return {
    neck: reference.neck * limb,
    chest: reference.chest * trunk,
    naturalWaist: read(NATURAL_WAIST_TO_HIP, age) * buttock,
    buttock,
    upperArm: reference.upperArm * limb,
    forearm: reference.forearm * limb,
    wrist: reference.wrist * limb,
    thigh: reference.thigh * limb,
    lowerThigh: reference.lowerThigh * limb,
    calf: reference.calf * limb,
    ankle: reference.ankle * limb,
  };
}
