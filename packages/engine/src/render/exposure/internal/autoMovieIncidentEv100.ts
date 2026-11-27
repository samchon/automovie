/**
 * The exposure value at ISO 100 an incident-light meter sets for an
 * illuminance: `log2(lux × 100 / 250)`, the incident-light meter equation of
 * ISO 2720:1974, `EV = log2(E × S / C)`, at speed `S = 100` with calibration
 * constant `C = 250`.
 *
 * With the saturation-based exposure of `IAutoMovieFilmOptics.ev100`, which
 * scales luminance by `1 / (1.2 × 2^ev100)`, an 18 % grey Lambert card under
 * that illuminance has luminance `0.18 × lux / π` and renders at `0.18 × 250 /
 * (100 × 1.2 × π) = 0.1194` linear before the tone curve, at any light level.
 *
 * @param lux Metered illuminance in lux; finite and above zero.
 * @returns EV100, in stops.
 * @throws Error when `lux` is not finite and above zero, which no meter can set
 *   an exposure for.
 */
export function autoMovieIncidentEv100(lux: number): number {
  if (!(lux > 0))
    throw new Error(
      `autoMovieIncidentEv100: lux must be finite and above zero, got ${lux}.`,
    );
  return Math.log2((lux * 100) / CALIBRATION);
}

/**
 * Incident-light calibration constant in lux seconds, the value ISO 2720:1974
 * recommends for flat-receptor meters.
 */
const CALIBRATION: number = 250;
