import { AutoMovieHumanSex } from "../structures/AutoMovieHumanSex";
import { IAutoMovieHumanGrowthCurve } from "./IAutoMovieHumanGrowthCurve";
import { interpolateAutoMovieHumanGrowthCurve } from "./interpolateAutoMovieHumanGrowthCurve";

/**
 * Median length or height for age, millimetres, from the WHO Child Growth Standards (2006; length/height-for-age, birth to 5 years) and the WHO Growth Reference 5-19 years (2007; height-for-age), read from the published LMS workbooks at the ages sampled here. Recumbent length is measured to 24 months and standing height afterwards, so the curve steps by the standards' own length-to-height difference near age 2. Grade: measured, then population-fitted (LMS smoothing).
 */
const WHO_STATURE: Record<AutoMovieHumanSex, IAutoMovieHumanGrowthCurve> = {
  male: {
    ages: [
      0, 0.25, 0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12, 13, 14, 15, 16, 17, 18,
      19,
    ],
    values: [
      499, 614, 676, 757, 823, 878, 961, 1033, 1100, 1160, 1273, 1378, 1491,
      1560, 1632, 1690, 1729, 1752, 1761, 1765,
    ],
  },
  female: {
    ages: [
      0, 0.25, 0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12, 13, 14, 15, 16, 17, 18,
      19,
    ],
    values: [
      491, 598, 657, 740, 807, 864, 951, 1027, 1094, 1151, 1266, 1386, 1512,
      1564, 1598, 1617, 1625, 1629, 1631, 1632,
    ],
  },
};

/**
 * Median stature at the end of growth for an age and sex, millimetres: the WHO median at that age, and the WHO median at 19 years for every later age.
 *
 * The WHO 19-year medians, 1765 mm for men and 1632 mm for women, agree with the 2015-2018 US NHANES adult means at 30 to 39 years (1763 and 1627 mm; Fryar et al. 2021, Vital Health Stat 3(46)), so adulthood keeps the 19-year value. Old-age loss is not part of this median; the converter subtracts it as spinal height separately. The reference is multi-ethnic and is used for every population, because no population-specific stature curve was read.
 *
 * @param sex Sex whose curve is read
 * @param age Age in years
 * @returns Median stature in millimetres
 */
export function estimateAutoMovieHumanMedianStature(
  sex: AutoMovieHumanSex,
  age: number,
): number {
  return interpolateAutoMovieHumanGrowthCurve(WHO_STATURE[sex], age);
}
