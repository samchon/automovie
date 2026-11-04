import { AutoMovieHumanSex } from "../typings/AutoMovieHumanSex";

/**
 * Defaults of the trunk's published breadths and depths that
 * `AutoMovieHumanBodyAnatomy.resolve` reads before holding them inside each
 * level's box (`AutoMovieHumanBodyBox.place`): ANSUR II model B lines on
 * stature, body mass index and age.
 */
export namespace AutoMovieHumanBodyBreadths {
  /** One sex's ANSUR II model B line, `a + stature S + bmi BMI + age A`, mm, S in mm, BMI in kg/m2, A in years. */
  export interface IModel {
    /** Intercept, mm. */
    a: number;

    /** Per millimetre of stature. */
    stature: number;

    /** Per kg/m2 of body mass index. */
    bmi: number;

    /** Per year of age. */
    age: number;
  }

  /**
   * The trunk's breadths and depths on stature, body mass index and age, mm:
   * ANSUR II model B, ordinary least squares by sex on the public working
   * databases (`docs/sources/ansur-ii.md`, "Model B girth regressions"; R2
   * 0.48 to 0.83). Chest depth at the chest point, waist breadth and depth at
   * omphalion, hip breadth, buttock depth at the buttock point, bideltoid and
   * bicristal breadths. Interim: these defaults stand until the girth lines of
   * the survey readings under `test/src/features/human/survey/` are run, the
   * chosen law (each measure on the girth of its own level, and the
   * natural waist's by the navel section's law at the natural girth); the
   * box placement (`AutoMovieHumanBodyBox.place`) then holds each default
   * inside the person's own girth's range, which carries the waist's
   * omphalion breadth and depth to the natural waist's girth.
   */
  export const TRUNK_MODEL: Readonly<
    Record<"chestDepth" | "waistBreadth" | "waistDepth" | "hipBreadth" | "buttockDepth" | "bideltoidBreadth" | "bicristalBreadth", readonly [IModel, IModel]>
  > = {
    chestDepth: [
      { a: -46.2, stature: 0.0795, bmi: 6.08, age: 0.32 },
      { a: -52.5, stature: 0.0842, bmi: 5.35, age: 0.35 },
    ],
    waistBreadth: [
      { a: -88.3, stature: 0.1193, bmi: 7.28, age: 0.28 },
      { a: -100.8, stature: 0.1257, bmi: 7.21, age: 0.22 },
    ],
    waistDepth: [
      { a: -71.3, stature: 0.0539, bmi: 7.28, age: 0.38 },
      { a: -119.5, stature: 0.0798, bmi: 6.96, age: 0.81 },
    ],
    hipBreadth: [
      { a: -25.7, stature: 0.1443, bmi: 5.59, age: 0.07 },
      { a: -14.9, stature: 0.1345, bmi: 4.59, age: -0.09 },
    ],
    buttockDepth: [
      { a: -40.5, stature: 0.074, bmi: 5.88, age: 0.1 },
      { a: -59.5, stature: 0.0822, bmi: 5.75, age: 0.06 },
    ],
    bideltoidBreadth: [
      { a: 54.6, stature: 0.1411, bmi: 6.58, age: -0.07 },
      { a: 65.5, stature: 0.1476, bmi: 6.72, age: -0.01 },
    ],
    bicristalBreadth: [
      { a: -22.7, stature: 0.1229, bmi: 3.5, age: 0.23 },
      { a: -8.4, stature: 0.1291, bmi: 2.19, age: -0.11 },
    ],
  };

  /** ANSUR II's mean age by sex, years, 28.9 and 30.2 (`docs/sources/ansur-ii.md`): the age the model B lines are read at. */
  export const ANSUR_II_AGE: readonly [number, number] = [28.9, 30.2];

  /** The body mass index range the model B lines were fitted over, kg/m2 (`docs/sources/ansur-ii.md`). */
  export const ANSUR_II_BMI: readonly [number, number] = [17, 40];

  /**
   * One measure's model B default for a person: the body mass index the fat
   * percentage implies by Deurenberg et al.'s relation (1991, Br J Nutr
   * 65(2):105-114: percent fat = 1.2 BMI + 0.23 age - 10.8 male - 5.4), held
   * in the lines' fitted range, read at ANSUR II's mean age of the sex.
   *
   * @param name The measure.
   * @param sex The person's sex, which selects the line.
   * @param stature Stature, mm.
   * @param fat Body fat percentage.
   * @returns The measure, mm.
   */
  export function model(name: keyof typeof TRUNK_MODEL, sex: AutoMovieHumanSex, stature: number, fat: number): number {
    const k: 0 | 1 = sex === AutoMovieHumanSex.Female ? 0 : 1;
    const age: number = ANSUR_II_AGE[k];
    const bmi: number = Math.min(ANSUR_II_BMI[1], Math.max(ANSUR_II_BMI[0], (fat - 0.23 * age + 10.8 * k + 5.4) / 1.2));
    const m: IModel = TRUNK_MODEL[name][k];
    return m.a + m.stature * stature + m.bmi * bmi + m.age * age;
  }
}
