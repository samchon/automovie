import { AutoMovieHumanSex } from "../structures/AutoMovieHumanSex";
import { IAutoMovieHumanIdentity } from "../structures/IAutoMovieHumanIdentity";
import { IAutoMovieHumanConversionContext } from "./IAutoMovieHumanConversionContext";
import { estimateAutoMovieHumanMedianStature } from "./estimateAutoMovieHumanMedianStature";
import { interpolateAutoMovieHumanGrowthCurve } from "./interpolateAutoMovieHumanGrowthCurve";
import { AutoMovieHumanGirthGrowth } from "./AutoMovieHumanGirthGrowth";
import { AutoMovieHumanGirthRegression } from "./AutoMovieHumanGirthRegression";

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
  const read: (curve: AutoMovieHumanGirthGrowth.ISexCurve, at: number) => number = (
    curve: AutoMovieHumanGirthGrowth.ISexCurve,
    at: number,
  ): number => interpolateAutoMovieHumanGrowthCurve(curve[sex], at);
  const adult: (atAge: number, stature: number) => IGirths = (
    atAge: number,
    stature: number,
  ): IGirths => adultGirths(context, atAge, stature, read);
  const weight: number = Math.min(
    1,
    Math.max(0, (age - AutoMovieHumanGirthGrowth.ADULT_FROM[0]) / (AutoMovieHumanGirthGrowth.ADULT_FROM[1] - AutoMovieHumanGirthGrowth.ADULT_FROM[0])),
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
  read: (curve: AutoMovieHumanGirthGrowth.ISexCurve, at: number) => number,
): IGirths {
  const sex: AutoMovieHumanSex = context.sex;
  const sampleAge: number = Math.min(
    AutoMovieHumanGirthRegression.ANSUR_AGES[1],
    Math.max(AutoMovieHumanGirthRegression.ANSUR_AGES[0], atAge),
  );
  // ANSUR II at the median person's BMI, moved by fat and limb lean mass each by their own reach
  const referenceBmi: number = context.bmi - context.bmiOffset;
  const composed: (key: keyof typeof AutoMovieHumanGirthRegression.ANSUR_II) => number = (
    key: keyof typeof AutoMovieHumanGirthRegression.ANSUR_II,
  ): number => {
    const split: { fat: number; lean: number } =
      AutoMovieHumanGirthRegression.COMPOSITION_SPLIT[AutoMovieHumanGirthRegression.SPLIT_SITE[key]][sex];
    return (
      referenceBmi +
      split.fat * context.fatIndexOffset +
      split.lean * context.leanIndexOffset
    );
  };
  const area: (
    key: keyof typeof AutoMovieHumanGirthRegression.ANSUR_II,
    atStature: number,
    bmi: number,
  ) => number = (
    key: keyof typeof AutoMovieHumanGirthRegression.ANSUR_II,
    atStature: number,
    bmi: number,
  ): number => {
    const r: AutoMovieHumanGirthRegression.IRegression = AutoMovieHumanGirthRegression.ANSUR_II[key][sex];
    return atStature * (r.area + r.bmi * bmi + r.age * sampleAge);
  };
  const fit: (key: keyof typeof AutoMovieHumanGirthRegression.ANSUR_II) => number = (
    key: keyof typeof AutoMovieHumanGirthRegression.ANSUR_II,
  ): number => Math.sqrt(area(key, stature, composed(key)));
  const late: number = AutoMovieHumanGirthRegression.ANSUR_AGES[1];
  const limbAgeing: number =
    atAge > late ? read(AutoMovieHumanGirthGrowth.NHANES_ARM, atAge) / read(AutoMovieHumanGirthGrowth.NHANES_ARM, late) : 1;
  const waistAgeing: number =
    atAge > late ? read(AutoMovieHumanGirthGrowth.NHANES_WAIST, atAge) / read(AutoMovieHumanGirthGrowth.NHANES_WAIST, late) : 1;

  // natural waist: the 1988 survey's relation to the navel waist and the buttock girth
  const natural: { intercept: number; navel: number; buttock: number } =
    AutoMovieHumanGirthRegression.NATURAL_WAIST[sex];
  const buttock: number = fit("buttock");
  const upperArm: number =
    read(AutoMovieHumanGirthGrowth.NHANES_ARM, atAge) *
    Math.sqrt(
      area("biceps", stature, composed("biceps")) /
        area(
          "biceps",
          estimateAutoMovieHumanMedianStature(sex, atAge),
          AutoMovieHumanGirthRegression.NHANES_ADULT_BMI,
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
  read: (curve: AutoMovieHumanGirthGrowth.ISexCurve, at: number) => number,
): IGirths {
  const { sex, age }: IAutoMovieHumanConversionContext = context;
  const reference: IGirths = adult(
    AutoMovieHumanGirthGrowth.REFERENCE_AGE,
    estimateAutoMovieHumanMedianStature(sex, AutoMovieHumanGirthGrowth.REFERENCE_AGE),
  );
  const firstWaist: number = AutoMovieHumanGirthGrowth.NHANES_WAIST[sex].ages[0]!;
  const trunkGrowth: number =
    (age < firstWaist
      ? (read(AutoMovieHumanGirthGrowth.NHANES_WAIST, firstWaist) *
          estimateAutoMovieHumanMedianStature(sex, age)) /
        estimateAutoMovieHumanMedianStature(sex, firstWaist)
      : read(AutoMovieHumanGirthGrowth.NHANES_WAIST, age)) / read(AutoMovieHumanGirthGrowth.NHANES_WAIST, AutoMovieHumanGirthGrowth.REFERENCE_AGE);
  const limbGrowth: number =
    read(AutoMovieHumanGirthGrowth.NHANES_ARM, age) / read(AutoMovieHumanGirthGrowth.NHANES_ARM, AutoMovieHumanGirthGrowth.REFERENCE_AGE);
  const tall: number = context.stature / context.medianStature;
  const trunk: number = trunkGrowth * tall;
  const limb: number = limbGrowth * tall;
  // each girth the 1977 survey measured grows by its own course; below its first bin, by the arm's
  const own: (key: keyof typeof AutoMovieHumanGirthGrowth.SNYDER_LIMB) => number = (
    key: keyof typeof AutoMovieHumanGirthGrowth.SNYDER_LIMB,
  ): number => {
    const curve: AutoMovieHumanGirthGrowth.ISexCurve = AutoMovieHumanGirthGrowth.SNYDER_LIMB[key];
    const first: number = curve[sex].ages[0]!;
    const last: number = curve[sex].ages[curve[sex].ages.length - 1]!;
    const infancy: number =
      age < first ? read(AutoMovieHumanGirthGrowth.NHANES_ARM, age) / read(AutoMovieHumanGirthGrowth.NHANES_ARM, first) : 1;
    return ((read(curve, age) * infancy) / read(curve, last)) * tall;
  };
  const buttock: number = reference.buttock * trunk;
  const upperArm: number = reference.upperArm * limb;
  const wrist: number = reference.wrist * own("wrist");
  const thigh: number = own("thigh");
  return {
    neck: reference.neck * limb,
    chest: reference.chest * trunk,
    naturalWaist: read(AutoMovieHumanGirthGrowth.NATURAL_WAIST_TO_HIP, age) * buttock,
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
 * Relaxed forearm girth from the relaxed upper arm and wrist girths by {@link AutoMovieHumanGirthRegression.RELAXED_FOREARM}.
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
    AutoMovieHumanGirthRegression.RELAXED_FOREARM[sex];
  return r.intercept + r.upperArm * upperArm + r.wrist * wrist;
}
