import { IAutoMovieHumanGrowthCurve } from "./IAutoMovieHumanGrowthCurve";
import { interpolateAutoMovieHumanGrowthCurve } from "./interpolateAutoMovieHumanGrowthCurve";

/**
 * Thickness of the subcutaneous fat over the back of the hand by age, millimetres: the dorsal superficial, intermediate and deep fatty laminae added together.
 *
 * Ultrasound of 105 Taiwanese adults in five decade groups found all three laminae thinning with age, age the only determinant in multiple regression (sex, BMI and hand dominance aside): from the 20s to over 60 the superficial lamina lost 0.21 mm (30.0%), the intermediate 1.38 mm (63.89%) and the deep 0.31 mm (20.95%), the intermediate losing most after 30 (Hung et al. 2022, Aesthet Surg J 42(10):1119-1126). The shares give the young laminae as 0.70, 2.16 and 1.48 mm, together 4.34 mm, and over 60 as 0.49, 0.78 and 1.17 mm, together 2.44 mm. The 20s are held to 30 and the over-60 group placed at 65; the straight line between is conventional, the study reporting decade means only. The intermediate lamina was thicker in men, by an amount the abstract does not give, so both sexes share the curve. No children were measured; the young adult value holds below 20.
 */
const DORSAL_HAND_FAT: IAutoMovieHumanGrowthCurve = {
  ages: [30, 65],
  values: [4.34, 2.44],
};

/**
 * Estimate the fat over the back of the hand from age.
 *
 * @param age Age in years
 * @returns Dorsal hand fat thickness, millimetres
 */
export function estimateAutoMovieHumanDorsalHandFat(age: number): number {
  return interpolateAutoMovieHumanGrowthCurve(DORSAL_HAND_FAT, age);
}
