import { AutoMovieHumanSex } from "../structures/AutoMovieHumanSex";
import { IAutoMovieHumanIdentity } from "../structures/IAutoMovieHumanIdentity";
import { IAutoMovieHumanGrowthCurve } from "./IAutoMovieHumanGrowthCurve";
import { interpolateAutoMovieHumanGrowthCurve } from "./interpolateAutoMovieHumanGrowthCurve";

/**
 * Median whole-body fat percentage of non-Hispanic White people by age, the NHANES 1999-2004 dual-energy X-ray absorptiometry reference (Kelly et al. 2009, PLoS ONE 4(9):e7038, supplementary Tables S9 for 8 to 18 years and S2 for 20 to 85). Grade: measured, then population-fitted (LMS).
 *
 * Below 8, where NHANES scanned no one, the curve is extended to 5.5 years by the course of the fat mass index in the Bone Mineral Density in Childhood Study (Zemel et al. 2023, Am J Clin Nutr 118(4):792-803, Table 3: Hologic scans of 2,011 healthy US children with 6% obesity, medians at 5 and 8 years of 3.279 and 3.489 kg/m² in boys, 4.035 and 4.342 in girls), the 8-year percentage scaled by that ratio on the assumption that body mass index stays level between 5 and 8. Grade: measured, then derived.
 */
const BODY_FAT: Record<AutoMovieHumanSex, IAutoMovieHumanGrowthCurve> = {
  male: {
    ages: [5.5, 8, 10, 12, 14, 16, 18, 20, 25, 30, 40, 50, 60, 65, 70, 80, 85],
    values: [
      24.9, 26.5, 27.1, 26.4, 23.8, 21.3, 22.1, 23.4, 24.6, 25.7, 27.5, 29.0,
      30.5, 31.1, 31.4, 31.6, 31.6,
    ],
  },
  female: {
    ages: [
      5.5, 8, 10, 12, 14, 16, 18, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70,
      75, 80, 85,
    ],
    values: [
      29.4, 31.6, 31.7, 31.4, 31.5, 32.5, 34.3, 35.1, 36.0, 37.0, 38.0, 38.9,
      39.8, 40.8, 41.7, 42.5, 43.0, 43.0, 42.9, 42.5, 42.1,
    ],
  },
};

/**
 * Median appendicular lean mass index by age, kilograms per square metre. Children from 5 to 19 take the Bone Mineral Density in Childhood Study's appendicular lean soft tissue index (Zemel et al. 2023, Table 3), read at the centre of each one-year bin; adults take the NHANES medians of non-Hispanic White people (Kelly et al. 2009, Table S6), which meet the children's at 20 within 0.2. The women's rows past 65 were not readable, so women past 65 follow the men's decline from 65. Grade: measured, then population-fitted (LMS); women past 65 derived.
 */
const LEAN_INDEX: Record<AutoMovieHumanSex, IAutoMovieHumanGrowthCurve> = {
  male: {
    ages: [
      5.5, 6.5, 7.5, 8.5, 9.5, 10.5, 11.5, 12.5, 13.5, 14.5, 15.5, 16.5, 17.5,
      18.5, 19.5, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85,
    ],
    values: [
      4.55, 4.8, 5.05, 5.29, 5.55, 5.84, 6.18, 6.6, 7.06, 7.52, 7.91, 8.2, 8.4,
      8.53, 8.63, 8.87, 8.94, 9.02, 9.09, 9.12, 9.11, 9.05, 8.95, 8.81, 8.64,
      8.44, 8.21, 7.97, 7.72,
    ],
  },
  female: {
    ages: [
      5.5, 6.5, 7.5, 8.5, 9.5, 10.5, 11.5, 12.5, 13.5, 14.5, 15.5, 16.5, 17.5,
      18.5, 19.5, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85,
    ],
    values: [
      4.2, 4.46, 4.71, 4.97, 5.26, 5.57, 5.87, 6.15, 6.37, 6.52, 6.61, 6.66,
      6.69, 6.7, 6.7, 6.81, 6.86, 6.9, 6.93, 6.95, 6.93, 6.9, 6.84, 6.76, 6.67,
      6.52, 6.34, 6.15, 5.96,
    ],
  },
};

/**
 * Standard deviation of whole-body fat percentage by age, percentage points: the σ column of the same NHANES tables (Kelly et al. 2009, Tables S9 and S2, non-Hispanic White). Below 8 the 8-year spread holds. Grade: measured, then population-fitted (LMS).
 */
const BODY_FAT_SD: Record<AutoMovieHumanSex, IAutoMovieHumanGrowthCurve> = {
  male: {
    ages: [
      8, 10, 12, 14, 16, 18, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80,
      85,
    ],
    values: [
      7.13, 7.28, 7.11, 6.4, 5.72, 6.22, 6.68, 6.49, 6.25, 5.97, 5.68, 5.44,
      5.3, 5.23, 5.19, 5.16, 5.11, 5.02, 4.88, 4.73,
    ],
  },
  female: {
    ages: [
      8, 10, 12, 14, 16, 18, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80,
      85,
    ],
    values: [
      6.5, 6.52, 6.46, 6.49, 6.68, 7.1, 7.22, 7.23, 7.21, 7.12, 6.96, 6.73,
      6.46, 6.16, 5.86, 5.58, 5.37, 5.24, 5.14, 5.08,
    ],
  },
};

/**
 * Standard deviation of the appendicular lean mass index by age, kilograms per square metre: the Bone Mineral Density in Childhood Study's coefficient of variation times its median from 5 to 19 years (Zemel et al. 2023, Table 3), then the σ column of the NHANES adult table (Kelly et al. 2009, Table S6). The women's rows past 65 were not readable and hold. Grade: measured, then population-fitted (LMS).
 */
const LEAN_INDEX_SD: Record<AutoMovieHumanSex, IAutoMovieHumanGrowthCurve> = {
  male: {
    ages: [
      5.5, 6.5, 7.5, 8.5, 9.5, 10.5, 11.5, 12.5, 13.5, 14.5, 15.5, 16.5, 17.5,
      18.5, 19.5, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85,
    ],
    values: [
      0.53, 0.56, 0.6, 0.64, 0.67, 0.71, 0.77, 0.83, 0.89, 0.95, 1.0, 1.04,
      1.07, 1.08, 1.09, 1.34, 1.32, 1.31, 1.3, 1.29, 1.27, 1.25, 1.22, 1.18,
      1.14, 1.09, 1.03, 0.97, 0.91,
    ],
  },
  female: {
    ages: [
      5.5, 6.5, 7.5, 8.5, 9.5, 10.5, 11.5, 12.5, 13.5, 14.5, 15.5, 16.5, 17.5,
      18.5, 19.5, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65,
    ],
    values: [
      0.5, 0.54, 0.58, 0.62, 0.66, 0.71, 0.75, 0.79, 0.82, 0.84, 0.86, 0.87,
      0.89, 0.9, 0.91, 1.04, 1.08, 1.11, 1.15, 1.17, 1.19, 1.18, 1.17, 1.14,
      1.1,
    ],
  },
};

/**
 * Standard deviations of each reference that one unit of adiposity or muscularity spans: plus or minus one reaches about the 2nd and 98th percentiles of the people of that sex and age, the large but living departure the traits define. Grade: conventional mapping onto measured spreads.
 */
const SPREAD: number = 2;

/**
 * Fat and lean mass of one person, and the body mass index and the departures from the median person they imply.
 *
 * Every age takes the medians of its own sex and age: a child's lean mass index is a child's, about half an adult's at 5 years, so a child never carries an adult's muscle relief, and fat follows the childhood course of a slight fall to the pubertal minimum in boys and a steady rise in girls. Adults rise in fat and fall in limb lean mass with age. Below 5.5 years, where neither reference scanned anyone, both hold their 5.5-year values. Adiposity moves body fat and muscularity the appendicular lean mass index each by two of its reference's standard deviations per unit, so a fashion model's 24% and a bodybuilder's 13% are inside the range at 20 years. Population is not read: the White medians serve every population.
 *
 * Fat and lean then fix the body mass index. The median person has the reference body mass index the girth regressions centre on, its fat-free mass index is that index times the median lean share, the person's own fat-free mass index scales with their limb lean mass, and fat is the rest at the person's fat percentage: `BMI = FFMI / (1 - fat)`. So a lean muscular person comes out heavy for their fat and a slim model light, rather than one index standing for both. The departures of the fat mass index and the appendicular lean mass index from the median person's are returned for the girths, which answer to fat and lean separately.
 *
 * @param props The person's sex, age, build and reference body mass index
 * @returns Composition, body mass index and departures from the median person
 */
export function estimateAutoMovieHumanComposition(props: {
  sex: AutoMovieHumanSex;
  age: number;
  adiposity: number;
  muscularity: number;
  referenceBmi: number;
}): estimateAutoMovieHumanComposition.IOutput {
  const { sex, age }: { sex: AutoMovieHumanSex; age: number } = props;
  const read: (
    curves: Record<AutoMovieHumanSex, IAutoMovieHumanGrowthCurve>,
  ) => number = (
    curves: Record<AutoMovieHumanSex, IAutoMovieHumanGrowthCurve>,
  ): number => interpolateAutoMovieHumanGrowthCurve(curves[sex], age);
  const medianFat: number = read(BODY_FAT) / 100;
  const medianLean: number = read(LEAN_INDEX);
  const fat: number = Math.min(
    0.75,
    Math.max(
      0.02,
      medianFat + (SPREAD * props.adiposity * read(BODY_FAT_SD)) / 100,
    ),
  );
  const lean: number = Math.min(
    16,
    Math.max(2, medianLean + SPREAD * props.muscularity * read(LEAN_INDEX_SD)),
  );
  const medianFatFree: number = props.referenceBmi * (1 - medianFat);
  const fatFree: number = (medianFatFree * lean) / medianLean;
  const bmi: number = fatFree / (1 - fat);
  return {
    composition: {
      bodyFatPercentage: fat * 100,
      appendicularLeanMassIndex: lean,
    },
    bmi,
    fatIndexOffset: bmi * fat - props.referenceBmi * medianFat,
    leanIndexOffset: lean - medianLean,
  };
}
/** Output type of {@link estimateAutoMovieHumanComposition}. */
export namespace estimateAutoMovieHumanComposition {
  /**
   * Composition of one person and what it implies for body mass.
   *
   * @author Samchon
   */
  export interface IOutput {
    /** Body fat percentage and appendicular lean mass index. */
    composition: IAutoMovieHumanIdentity.IComposition;

    /** Body mass index, kilograms per square metre, on the reference scale the girth regressions read. */
    bmi: number;

    /** Fat mass index less the median person's, kilograms per square metre. */
    fatIndexOffset: number;

    /** Appendicular lean mass index less the median person's, kilograms per square metre. */
    leanIndexOffset: number;
  }
}
