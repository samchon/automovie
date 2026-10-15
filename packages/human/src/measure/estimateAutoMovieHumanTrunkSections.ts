import { AutoMovieHumanSex } from "../structures/AutoMovieHumanSex";
import { IAutoMovieHumanIdentity } from "../structures/IAutoMovieHumanIdentity";
import { IAutoMovieHumanConversionContext } from "./IAutoMovieHumanConversionContext";

/**
 * A breadth or depth regression `intercept + stature·S + bmi·B + age·a`, millimetres, with stature in millimetres, body mass index in kilograms per square metre and age in years.
 */
interface IRegression {
  intercept: number;
  stature: number;
  bmi: number;
  age: number;
}

/**
 * Trunk breadths and depths, our ordinary least squares fits per sex on the public ANSUR II working databases (Gordon et al. 2014, NATICK/TR-15/007; Paquette and Parham 2017), 1,986 women and 4,082 men aged 17 to 58, on stature, BMI and age. Chest breadth is taken under the arms with tissue compressed; the waist is ANSUR's navel waist; hip breadth spans the buttocks standing. Fat deepens the chest about twice as fast as it widens it, and the waist equally in both. Grade: population-fitted.
 */
const ANSUR_II: Record<
  | "chestBreadth"
  | "chestDepth"
  | "waistBreadth"
  | "waistDepth"
  | "hipBreadth"
  | "buttockDepth",
  Record<AutoMovieHumanSex, IRegression>
> = {
  chestBreadth: {
    female: { intercept: 37.2, stature: 0.0904, bmi: 3.3, age: 0.03 },
    male: { intercept: 49.3, stature: 0.0911, bmi: 2.71, age: 0.17 },
  },
  chestDepth: {
    female: { intercept: -46.2, stature: 0.0795, bmi: 6.08, age: 0.32 },
    male: { intercept: -52.5, stature: 0.0842, bmi: 5.35, age: 0.35 },
  },
  waistBreadth: {
    female: { intercept: -88.3, stature: 0.1193, bmi: 7.28, age: 0.28 },
    male: { intercept: -100.8, stature: 0.1257, bmi: 7.21, age: 0.22 },
  },
  waistDepth: {
    female: { intercept: -71.3, stature: 0.0539, bmi: 7.28, age: 0.38 },
    male: { intercept: -119.5, stature: 0.0798, bmi: 6.96, age: 0.81 },
  },
  hipBreadth: {
    female: { intercept: -25.7, stature: 0.1443, bmi: 5.59, age: 0.07 },
    male: { intercept: -14.9, stature: 0.1345, bmi: 4.59, age: -0.09 },
  },
  buttockDepth: {
    female: { intercept: -40.5, stature: 0.074, bmi: 5.88, age: 0.1 },
    male: { intercept: -59.5, stature: 0.0822, bmi: 5.75, age: 0.06 },
  },
};

/**
 * Circumference over the sum of breadth and depth at each level, ANSUR II means (same survey): chest 946.9 / (269.3 + 247.4) for women and 1058.7 / (289.4 + 253.8) for men, navel waist 860.9 / (299.9 + 213.0) and 940.6 / (326.4 + 237.8), buttock 1021.2 / (353.8 + 232.9) and 1019.5 / (345.7 + 245.8). An ellipse gives about 1.57 and a rectangle 2, so the factor states how square the mean section is. Grade: measured.
 */
const PERIMETER_FACTOR: Record<
  "chest" | "waist" | "buttock",
  Record<AutoMovieHumanSex, number>
> = {
  chest: { female: 1.833, male: 1.949 },
  waist: { female: 1.679, male: 1.667 },
  buttock: { female: 1.741, male: 1.724 },
};

/**
 * Bust over underbust circumference in young women: 1.17 on average in 106 US college women measured in 3D (Lassek and Gaulin 2016, Evol Psychol 14(2)). Grade: measured.
 */
const BUST_PER_UNDERBUST: number = 1.17;

/**
 * Ages over which a girl's bust grows from none to the adult ratio, years: breast budding begins at about 10 and the adult contour is reached by about 16. No measured bust-to-underbust course by age was read. Grade: conventional.
 */
const BREAST_GROWTH: [number, number] = [10, 16];

/** Bounds of the ANSUR II sample the regressions are read inside: stature (mm), BMI and age (years). */
const SAMPLE: Record<"stature" | "bmi" | "age", [number, number]> = {
  stature: [1400, 2000],
  bmi: [17, 40],
  age: [17, 58],
};

/**
 * Breadths, depths and the underbust girth of the trunk's measured sections, from the girths the converter already resolved.
 *
 * Each section's size comes from its circumference and its proportions from ANSUR II: the regressions give the share of breadth in breadth plus depth for the person's stature, BMI and age, read inside the sample's ranges, and the sex's mean perimeter factor turns the circumference into breadth plus depth. The natural waist takes the navel waist's proportions, the only waist ANSUR measures; the buttock depth takes its share against hip breadth. Children and old people keep the proportions of the nearest adult sample, so growth and ageing change sizes through their girths alone; no child or old-age depth was read.
 *
 * Women's underbust is the bust over 1.17, girls' growing to it between 10 and 16 years; men's equals the chest circumference, so the trunk carries no breast volume and the pectoral form comes from muscularity. No measured underbust of men was read.
 *
 * @param context Resolved person
 * @param girths Chest, natural waist and buttock circumferences and hip breadth, millimetres
 * @returns The trunk section measurements, millimetres
 */
export function estimateAutoMovieHumanTrunkSections(
  context: IAutoMovieHumanConversionContext,
  girths: Pick<
    IAutoMovieHumanIdentity.IBody,
    | "chestCircumference"
    | "waistCircumference"
    | "buttockCircumference"
    | "hipBreadth"
  >,
): Pick<
  IAutoMovieHumanIdentity.IBody,
  | "chestBreadth"
  | "chestDepth"
  | "underbustCircumference"
  | "waistBreadth"
  | "waistDepth"
  | "buttockDepth"
> {
  const sex: AutoMovieHumanSex = context.sex;
  const within = (x: number, [low, high]: [number, number]): number =>
    Math.min(high, Math.max(low, x));
  const fit = (key: keyof typeof ANSUR_II): number => {
    const r: IRegression = ANSUR_II[key][sex];
    return (
      r.intercept +
      r.stature * within(context.peakStature, SAMPLE.stature) +
      r.bmi * within(context.bmi, SAMPLE.bmi) +
      r.age * within(context.age, SAMPLE.age)
    );
  };
  const split = (
    circumference: number,
    level: keyof typeof PERIMETER_FACTOR,
    breadth: number,
    depth: number,
  ): [number, number] => {
    const sum: number = circumference / PERIMETER_FACTOR[level][sex];
    const share: number = breadth / (breadth + depth);
    return [share * sum, (1 - share) * sum];
  };
  const [chestBreadth, chestDepth]: [number, number] = split(
    girths.chestCircumference,
    "chest",
    fit("chestBreadth"),
    fit("chestDepth"),
  );
  const [waistBreadth, waistDepth]: [number, number] = split(
    girths.waistCircumference,
    "waist",
    fit("waistBreadth"),
    fit("waistDepth"),
  );
  const [, buttockDepth]: [number, number] = split(
    girths.buttockCircumference,
    "buttock",
    fit("hipBreadth"),
    fit("buttockDepth"),
  );
  const growth: number =
    sex === "male"
      ? 0
      : within(
          (context.age - BREAST_GROWTH[0]) /
            (BREAST_GROWTH[1] - BREAST_GROWTH[0]),
          [0, 1],
        );
  return {
    chestBreadth,
    chestDepth,
    underbustCircumference:
      girths.chestCircumference / (1 + growth * (BUST_PER_UNDERBUST - 1)),
    waistBreadth,
    waistDepth,
    buttockDepth,
  };
}
