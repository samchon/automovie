import { IAutoMovieHumanGrowthCurve } from "./IAutoMovieHumanGrowthCurve";
import { interpolateAutoMovieHumanGrowthCurve } from "./interpolateAutoMovieHumanGrowthCurve";

/**
 * Navicular height over foot length by age, standing with full weight on the foot.
 *
 * - 2 to 6 years: mean navicular height over mean foot length of Taiwanese preschool children by year of age, 15.75 / 141.0, 19.29 / 158.8, 22.67 / 172.9, 22.94 / 184.3 and 27.00 / 184.7 mm, measured from the lowest palpable medial projection of the navicular to the supporting surface standing on one leg (Chang et al. 2012, Biomed Eng Online 11:76, 44 children, 88 feet). Grade: measured, ratio derived.
 * - Adults: 0.20 (SD 0.03) in Dutch adults aged 19 to 59, the perpendicular distance of the navicular from the line joining the two ground contacts of the medial arch, photographed under full weight-bearing (Stolwijk et al. 2013, PLoS ONE 8(2):e57209). Malawian adults of the same study, who grew up mostly barefoot, measure 0.17. Grade: measured.
 *
 * The arch rises through childhood as the plantar fat pad that fills an infant's arch recedes and the bones ossify; the straight line from 6 to 18 years is conventional, since no source read measures the ages between. Below 2 years the 2-year ratio holds. No source read gives a numeric change in old age (older feet are reported both flatter and higher), so the adult ratio holds.
 */
const NAVICULAR_PER_FOOT: IAutoMovieHumanGrowthCurve = {
  ages: [2, 3, 4, 5, 6, 18],
  values: [0.112, 0.121, 0.131, 0.124, 0.146, 0.2],
};

/**
 * Estimate navicular height, which sets the medial longitudinal arch, from age and foot length.
 *
 * @param age Age in years
 * @param footLength Foot length, millimetres
 * @returns Navicular height above the standing surface, millimetres
 */
export function estimateAutoMovieHumanNavicularHeight(
  age: number,
  footLength: number,
): number {
  return (
    interpolateAutoMovieHumanGrowthCurve(NAVICULAR_PER_FOOT, age) * footLength
  );
}
