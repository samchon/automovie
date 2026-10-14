import { AutoMovieHumanSex } from "../structures/AutoMovieHumanSex";
import { IAutoMovieHumanIdentity } from "../structures/IAutoMovieHumanIdentity";
import { IAutoMovieHumanConversionContext } from "./IAutoMovieHumanConversionContext";
import { IAutoMovieHumanGrowthCurve } from "./IAutoMovieHumanGrowthCurve";
import { interpolateAutoMovieHumanGrowthCurve } from "./interpolateAutoMovieHumanGrowthCurve";

/**
 * Median whole-body fat percentage of non-Hispanic White adults by age, the NHANES 1999-2004 dual-energy X-ray absorptiometry reference curves (Kelly et al. 2009, PLoS ONE 4(9):e7038, supplementary tables). The women's rows between 25 and 80 years were not readable, so women are interpolated straight between 25 and 80. Grade: measured, then population-fitted (LMS).
 */
const BODY_FAT: Record<AutoMovieHumanSex, IAutoMovieHumanGrowthCurve> = {
  male: {
    ages: [20, 25, 30, 40, 50, 60, 65, 70, 80, 85],
    values: [23.4, 24.6, 25.7, 27.5, 29.0, 30.5, 31.1, 31.4, 31.6, 31.6],
  },
  female: {
    ages: [20, 25, 80, 85],
    values: [35.1, 36.0, 42.5, 42.1],
  },
};

/**
 * Median appendicular lean mass index of non-Hispanic White men by age, kilograms per square metre, from the same reference (Kelly et al. 2009). Only the women's value at 20 years, 6.81, was readable, so women take the men's curve scaled to it. Grade: measured; the women's age course derived.
 */
const LEAN_INDEX: IAutoMovieHumanGrowthCurve = {
  ages: [20, 25, 30, 40, 50, 60, 65, 70, 80, 85],
  values: [8.87, 8.94, 9.02, 9.12, 9.05, 8.81, 8.64, 8.44, 7.97, 7.72],
};

/** Women's appendicular lean mass index at 20 years (Kelly et al. 2009), kilograms per square metre. */
const FEMALE_LEAN_INDEX_AT_20: number = 6.81;

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
 * Adults take the NHANES medians for age, which rise in fat and fall in limb lean mass with age; adiposity adds fat at the per-BMI rate the same reference implies, and muscularity scales the lean mass index (see the converter for both units). Children under 20 hold the 20-year values, because the reference's child rows were not read; the skeleton and girths of a child do not read composition. Population is not read: the reference's White medians serve every population.
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
  const maleLean: number = interpolateAutoMovieHumanGrowthCurve(LEAN_INDEX, age);
  const lean: number =
    (sex === "male"
      ? maleLean
      : (FEMALE_LEAN_INDEX_AT_20 * maleLean) / LEAN_INDEX.values[0]!) * leanScale;
  return {
    bodyFatPercentage: Math.min(75, Math.max(2, fat)),
    appendicularLeanMassIndex: Math.min(16, Math.max(2, lean)),
  };
}
