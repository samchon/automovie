import { AUTOMOVIE_REC709_XYZ } from "../../AUTOMOVIE_REC709_XYZ";

/*
 * The colour of a black body at `kelvin`, as linear Rec. 709 RGB with luminance
 * Y = 1: the light colour a tungsten lamp, a candle or daylight of that
 * temperature casts, and the white that `IAutoMovieFilmOptics.whiteBalance`
 * adapts away.
 *
 * The chromaticity is the cubic approximation of the Planckian locus by Kim et
 * al. (2002), whose coefficients cover 1667 K to 25000 K; the result is mapped
 * from XYZ by AUTOMOVIE_REC709_XYZ. Saturated low temperatures leave the
 * Rec. 709 gamut slightly, so a channel may be a little below zero; it is
 * returned as computed, because clamping it would change the white the balance
 * adapts.
 *
 * Throws when `kelvin` is not finite or lies outside [1667, 25000], the
 * approximation's range.
 */
export function autoMoviePlanckianWhite(
  kelvin: number,
): [number, number, number] {
  if (!(kelvin >= 1667 && kelvin <= 25000))
    throw new Error(
      `A Planckian white needs a temperature within [1667, 25000] K, got ${kelvin}`,
    );

  // x from 1/T, in two pieces split at 4000 K.
  const t1: number = 1e3 / kelvin;
  const t2: number = t1 * t1;
  const t3: number = t2 * t1;
  const x: number =
    kelvin <= 4000
      ? -0.2661239 * t3 - 0.2343589 * t2 + 0.8776956 * t1 + 0.17991
      : -3.0258469 * t3 + 2.1070379 * t2 + 0.2226347 * t1 + 0.24039;

  // y from x, in three pieces split at 2222 K and 4000 K.
  const x2: number = x * x;
  const x3: number = x2 * x;
  const y: number =
    kelvin <= 2222
      ? -1.1063814 * x3 - 1.3481102 * x2 + 2.18555832 * x - 0.20219683
      : kelvin <= 4000
        ? -0.9549476 * x3 - 1.37418593 * x2 + 2.09137015 * x - 0.16748867
        : 3.081758 * x3 - 5.8733867 * x2 + 3.75112997 * x - 0.37001483;

  // XYZ at unit luminance, then linear Rec. 709.
  const xyz: [number, number, number] = [x / y, 1, (1 - x - y) / y];
  const m: readonly number[] = AUTOMOVIE_REC709_XYZ.fromXyz;
  return [
    m[0]! * xyz[0] + m[1]! * xyz[1] + m[2]! * xyz[2],
    m[3]! * xyz[0] + m[4]! * xyz[1] + m[5]! * xyz[2],
    m[6]! * xyz[0] + m[7]! * xyz[1] + m[8]! * xyz[2],
  ];
}
