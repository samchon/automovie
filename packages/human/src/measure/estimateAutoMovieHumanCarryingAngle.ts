import { AutoMovieHumanSex } from "../structures/AutoMovieHumanSex";
import { IAutoMovieHumanGrowthCurve } from "./IAutoMovieHumanGrowthCurve";
import { interpolateAutoMovieHumanGrowthCurve } from "./interpolateAutoMovieHumanGrowthCurve";

/**
 * Mean carrying angle by age, both sexes and both sides pooled, degrees, positive valgus: 921 healthy Thai children from birth to 16 years, one group per year of age, the arm abducted on a table with the elbow fully extended and the forearm supinated, a full-circle goniometer centred on the cubital crease with its arms along the arm and forearm axes (Kaewpornsawan et al. 2018, Siriraj Med J 70(4):284-288, Table 1). The newborn group sits at age 0 and every later group at the middle of its year. The angle stabilises at 15 years, so later ages hold the last group. Grade: measured.
 */
const CARRYING_ANGLE: IAutoMovieHumanGrowthCurve = {
  ages: [
    0, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5, 11.5, 12.5, 13.5,
    14.5, 15.5, 16.5,
  ],
  values: [
    -1.5, 3.9, 5.8, 6.8, 6, 6, 6, 7.4, 8.2, 8.4, 9, 9.5, 10.3, 9.7, 10.6, 11,
    11.3,
  ],
};

/**
 * Each sex's mean over the pooled mean in the same study: 6.9 degrees in 407 boys and 8.5 in 514 girls against 7.8 over all 1,842 sides (Kaewpornsawan et al. 2018, Table 2), applied at every age. Grade: derived.
 */
const SEX_FACTOR: Record<AutoMovieHumanSex, number> = {
  female: 8.5 / 7.8,
  male: 6.9 / 7.8,
};

/**
 * Carrying angle of the elbow for a sex and age.
 *
 * The pooled age course scaled by the sex's ratio, so a newborn's elbow is slightly varus, a child's about 6 degrees valgus, and an adult's 12.3 degrees in women and 10.0 in men. Adults hold the 16-year value: the source ends there and states that the angle has stabilised. Population is not read; the study measured Thai children only.
 *
 * @param sex Which sex's ratio to apply
 * @param age Age in years
 * @returns Carrying angle in degrees, positive valgus
 */
export function estimateAutoMovieHumanCarryingAngle(
  sex: AutoMovieHumanSex,
  age: number,
): number {
  return (
    interpolateAutoMovieHumanGrowthCurve(CARRYING_ANGLE, age) * SEX_FACTOR[sex]
  );
}
