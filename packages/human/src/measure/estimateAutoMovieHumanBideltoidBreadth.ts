import { AutoMovieHumanSex } from "../structures/AutoMovieHumanSex";
import { IAutoMovieHumanConversionContext } from "./IAutoMovieHumanConversionContext";

/**
 * A breadth regression `intercept + stature·S + bmi·B + age·a`, millimetres, with stature in millimetres, body mass index in kilograms per square metre and age in years.
 */
interface IRegression {
  intercept: number;
  stature: number;
  bmi: number;
  age: number;
}

/**
 * Bideltoid and biacromial breadth, our ordinary least squares fits per sex on the public ANSUR II working databases (Gordon et al. 2014, NATICK/TR-15/007; Paquette and Parham 2017), 1,986 women and 4,082 men aged 17 to 58. Bideltoid R² 0.76 (women) and 0.79 (men), means 450.3 and 510.4 mm; biacromial means 365.3 and 415.7 mm. A BMI unit widens the deltoids by 6.6 and 6.7 mm but the bony shoulders by only 1.1 and 1.9. Grade: population-fitted.
 */
const ANSUR_II: Record<
  "bideltoid" | "biacromial",
  Record<AutoMovieHumanSex, IRegression>
> = {
  bideltoid: {
    female: { intercept: 54.61, stature: 0.1411, bmi: 6.585, age: -0.07 },
    male: { intercept: 65.52, stature: 0.1476, bmi: 6.716, age: -0.006 },
  },
  biacromial: {
    female: { intercept: 84.76, stature: 0.1583, bmi: 1.083, age: -0.167 },
    male: { intercept: 106.32, stature: 0.1482, bmi: 1.907, age: -0.124 },
  },
};

/** Bounds of the ANSUR II sample the regressions are read inside: stature (mm), BMI and age (years). */
const SAMPLE: Record<"stature" | "bmi" | "age", [number, number]> = {
  stature: [1400, 2000],
  bmi: [17, 40],
  age: [17, 58],
};

/**
 * Bideltoid breadth: the person's own bony biacromial breadth plus the soft tissue the deltoids add outside it.
 *
 * That margin is the ANSUR II bideltoid fit less the biacromial fit at the person's peak stature, BMI and age, read inside the sample's ranges, and scaled by the person's biacromial breadth over the fitted one. So an adult of the sample's build gets the fitted bideltoid breadth, adiposity and muscularity widen the deltoids through BMI while the bones stay, and a child's or a slim frame's narrower shoulders carry a proportionally narrower margin. No child bideltoid breadth was read.
 *
 * @param context Resolved person
 * @param biacromialBreadth The person's biacromial breadth, millimetres
 * @returns Bideltoid breadth in millimetres
 */
export function estimateAutoMovieHumanBideltoidBreadth(
  context: IAutoMovieHumanConversionContext,
  biacromialBreadth: number,
): number {
  const within = (x: number, [low, high]: [number, number]): number =>
    Math.min(high, Math.max(low, x));
  const fit = (key: keyof typeof ANSUR_II): number => {
    const r: IRegression = ANSUR_II[key][context.sex];
    return (
      r.intercept +
      r.stature * within(context.peakStature, SAMPLE.stature) +
      r.bmi * within(context.bmi, SAMPLE.bmi) +
      r.age * within(context.age, SAMPLE.age)
    );
  };
  const bony: number = fit("biacromial");
  return biacromialBreadth * (1 + (fit("bideltoid") - bony) / bony);
}
