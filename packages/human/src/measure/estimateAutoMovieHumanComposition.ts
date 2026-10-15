import { AutoMovieHumanSex } from "../structures/AutoMovieHumanSex";
import { IAutoMovieHumanIdentity } from "../structures/IAutoMovieHumanIdentity";
import { IAutoMovieHumanConversionContext } from "./IAutoMovieHumanConversionContext";
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
 * Body fat percentage points gained per BMI unit of adiposity: Kelly et al. state that fat mass indices of 9 and 13 kg/m² (women) and 6 and 9 kg/m² (men) match BMI 25 and 30 at 25 years, which is 36% to 43% and 24% to 30% fat, so 1.4 and 1.2 points per BMI unit. Grade: derived.
 */
const FAT_PER_BMI: Record<AutoMovieHumanSex, number> = {
  female: 1.4,
  male: 1.2,
};

/**
 * Fat and lean mass of one person.
 *
 * Every age takes the medians of its own sex and age: a child's lean mass index is a child's, about half an adult's at 5 years, so a child never carries an adult's muscle relief, and fat follows the childhood course of a slight fall to the pubertal minimum in boys and a steady rise in girls. Adults rise in fat and fall in limb lean mass with age. Below 5.5 years, where neither reference scanned anyone, both hold their 5.5-year values. Adiposity adds fat at the per-BMI rate the adult reference implies, and muscularity scales the lean mass index (see the converter for both units). Population is not read: the White medians serve every population.
 *
 * @param context Resolved person
 * @param adiposityBmi BMI units the adiposity offset added
 * @param leanScale Factor muscularity applies to the lean mass index
 * @returns Composition within the identity's bounds
 */
export function estimateAutoMovieHumanComposition(
  context: IAutoMovieHumanConversionContext,
  adiposityBmi: number,
  leanScale: number,
): IAutoMovieHumanIdentity.IComposition {
  const { sex, age }: IAutoMovieHumanConversionContext = context;
  const fat: number =
    interpolateAutoMovieHumanGrowthCurve(BODY_FAT[sex], age) +
    FAT_PER_BMI[sex] * adiposityBmi;
  const lean: number =
    interpolateAutoMovieHumanGrowthCurve(LEAN_INDEX[sex], age) * leanScale;
  return {
    bodyFatPercentage: Math.min(75, Math.max(2, fat)),
    appendicularLeanMassIndex: Math.min(16, Math.max(2, lean)),
  };
}
