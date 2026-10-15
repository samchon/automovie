import { AutoMovieHumanSex } from "../structures/AutoMovieHumanSex";

/** Age at which the fitted spinal height loss starts, years. */
const ONSET_AGE: number = 40;

/** Oldest age the fit samples (the 80+ group taken at 85), years; the loss holds beyond it. */
const LAST_AGE: number = 85;

/**
 * Coefficient of the spinal height loss c(age − 40)², millimetres per square year. Fitted by least squares through the origin to the fall of mean stature from the 30-39 group in the 2015-2018 US NHANES cross-sectional tables (Fryar et al. 2021, Vital Health Stat 3(46), Table 9 and 11): women 4, 14, 20, 45 and 71 mm, men 0, 9, 19, 33 and 59 mm at the group centres 45, 55, 65, 75 and 85 (80+ taken at 85). Cross-sectional means also carry taller recent birth cohorts, so the fit is an upper bound of individual ageing. Grade: population-fitted.
 */
const LOSS_COEFFICIENT: Record<AutoMovieHumanSex, number> = {
  female: 0.0355,
  male: 0.0288,
};

/**
 * Stature lost in old age, millimetres, all of it in the spine.
 *
 * Old-age stature loss comes from the discs, kyphosis and vertebral fractures, while the long bones keep their length: in the same NHANES tables the bone-landmark upper arm length stays flat from the twenties to 80+ (women 359 to 356 mm, men 390 to 390 mm) while stature falls about 60 mm. The converter therefore subtracts this loss from stature, sitting height and every trunk height above the hips, and never from a limb. Beyond 85, the oldest sample, the loss holds rather than following the parabola outside the data.
 *
 * @param sex Sex whose fit is read
 * @param age Age in years
 * @returns Loss in millimetres, zero before 40 and held after 85
 */
export function estimateAutoMovieHumanSpinalLoss(
  sex: AutoMovieHumanSex,
  age: number,
): number {
  const years: number =
    Math.min(LAST_AGE, Math.max(ONSET_AGE, age)) - ONSET_AGE;
  return LOSS_COEFFICIENT[sex] * years * years;
}
