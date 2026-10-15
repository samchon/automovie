import { AutoMovieHumanSex } from "../structures/AutoMovieHumanSex";

/**
 * Natural waist height as a fraction of the span from trochanterion height to cervicale height: means of the per-subject fractions in the 1988 US Army survey (Gordon et al. 1989, NATICK/TR-89/044; 2,208 women and 1,774 men, our computation on the public records), 0.3564 (SD 0.0335) in women and 0.3361 (0.0218) in men. Over that sample the fraction places the natural waist within 18.3 and 12.0 mm of its measured height (residual standard deviations), as close as a regression on both heights (17.8 and 12.5 mm). Grade: population-fitted.
 */
const WAIST_FRACTION: Record<AutoMovieHumanSex, number> = {
  female: 0.3564,
  male: 0.3361,
};

/**
 * Height of the natural waist, the level of the torso's greatest lateral indentation, above the standing surface.
 *
 * It is placed on the trunk between the greater trochanter and the seventh cervical spinous process, so it follows the person's own trunk length and leg length rather than stature. Children and people past the survey's ages hold the adult fraction, for want of a measured natural waist height outside it; old age lowers the waist with the cervicale as the spine loses height.
 *
 * @param sex Which sex's fraction to read
 * @param trochanterionHeight Height of the greater trochanter, millimetres
 * @param cervicaleHeight Height of the seventh cervical spinous process, millimetres
 * @returns Natural waist height in millimetres
 */
export function estimateAutoMovieHumanWaistHeight(
  sex: AutoMovieHumanSex,
  trochanterionHeight: number,
  cervicaleHeight: number,
): number {
  return (
    trochanterionHeight +
    WAIST_FRACTION[sex] * (cervicaleHeight - trochanterionHeight)
  );
}
