import { AutoMovieHumanSex } from "../structures/AutoMovieHumanSex";

/**
 * Thyroid angle means, degrees, from computed tomography of 283 patients aged 8 to 20 (Glikson et al. 2017, Laryngoscope 127(10):E354-E358): the female mean stays between 91 and 97 degrees in every age group, 94.25 overall, while the male mean falls from 92 in the youngest group to 67 in the oldest, most steeply at 14 to 15 years. Grade: measured; the course of the male fall between its end values is ours, a smooth step centred on 14.5 years.
 */
const GLIKSON_2017 = {
  female: 94.25,
  maleChild: 92,
  maleAdult: 67,
  /** Ages between which the male angle narrows, years. */
  onset: 12,
  end: 17,
};

/**
 * The thyroid angle of one person: the internal angle between the thyroid laminae at the vocal folds, which decides how far the laryngeal prominence projects.
 *
 * The angle is the same in both sexes before puberty and narrows in boys through it, so the Adam's apple grows out of a neck that was the same in childhood. Below 8 and above 20, the ages the study sampled, the converter holds its youngest and oldest values.
 *
 * @param sex Sex whose course is read
 * @param age Age in years
 * @returns Angle in degrees
 */
export function estimateAutoMovieHumanThyroidAngle(
  sex: AutoMovieHumanSex,
  age: number,
): number {
  if (sex === "female") return GLIKSON_2017.female;
  const t: number = Math.min(
    1,
    Math.max(
      0,
      (age - GLIKSON_2017.onset) / (GLIKSON_2017.end - GLIKSON_2017.onset),
    ),
  );
  const step: number = t * t * (3 - 2 * t);
  return (
    GLIKSON_2017.maleChild +
    (GLIKSON_2017.maleAdult - GLIKSON_2017.maleChild) * step
  );
}
