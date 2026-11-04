import { AutoMovieHumanHairCurl } from "../typings/AutoMovieHumanHairCurl";
import { AutoMovieHumanAppearanceNoise } from "./AutoMovieHumanAppearanceNoise";
import type { AutoMovieHumanSkinVector } from "./AutoMovieHumanSkinVector";

/**
 * A card's in-plane wave by curl class: an amplitude and wavelength that
 * grow tighter from class I (straight) to VIII, with a phase that varies
 * smoothly over the scalp so neighbouring cards wave together as one lock
 * instead of crossing each other. A class names curve diameter and twist
 * ranges (Callender 2026), not these values, which are conventions of a card
 * representation that cannot show tight coils; the wave grows over the first
 * 10 mm so a card leaves the scalp straight.
 */
export namespace AutoMovieHumanHairCardCurl {
  /**
   * Amplitude and wavelength of a class.
   *
   * @param curl Curl class
   * @returns `[amplitude mm, wavelength mm]`
   */
  export function parameters(curl: AutoMovieHumanHairCurl): [number, number] {
    return CURL[curl];
  }

  /**
   * The wave's phase of one card: value noise over the root's chart angles,
   * twelve cells around the head (the azimuth's magnitude, so it mirrors),
   * plus a little per card.
   *
   * @param r Unit direction of the card's root
   * @param seed The root's seed, shared with its mirror
   * @returns Phase, radians
   */
  export function phase(
    r: AutoMovieHumanSkinVector.Vec3,
    seed: number,
  ): number {
    return (
      2 *
      Math.PI *
      (AutoMovieHumanAppearanceNoise.value2(
        9,
        (Math.abs(Math.atan2(r[2], r[0])) / (2 * Math.PI)) * 12,
        (Math.asin(Math.max(-1, Math.min(1, r[1]))) / Math.PI) * 6,
        12,
      ) +
        0.05 * AutoMovieHumanAppearanceNoise.hash(9, seed))
    );
  }

  /**
   * The wave's lateral offset at an arc length.
   *
   * @param hand -1 for a mirrored card, whose width axis is reversed, else 1
   * @param amplitude Wave amplitude, millimetres
   * @param wavelength Wavelength, millimetres
   * @param s Arc length from the root, millimetres
   * @param phase The card's phase, radians
   * @returns Offset along the width axis, millimetres
   */
  export function offset(
    hand: number,
    amplitude: number,
    wavelength: number,
    s: number,
    phase: number,
  ): number {
    return (
      hand *
      amplitude *
      Math.sin((2 * Math.PI * s) / wavelength + phase) *
      Math.min(1, s / 10)
    );
  }
}

/** In-plane wave `[amplitude mm, wavelength mm]` per curl class (conventions). */
const CURL: Record<AutoMovieHumanHairCurl, [number, number]> = {
  [AutoMovieHumanHairCurl.I]: [0, 1],
  [AutoMovieHumanHairCurl.II]: [1.5, 45],
  [AutoMovieHumanHairCurl.III]: [3, 32],
  [AutoMovieHumanHairCurl.IV]: [4.5, 24],
  [AutoMovieHumanHairCurl.V]: [5.5, 16],
  [AutoMovieHumanHairCurl.VI]: [6, 12],
  [AutoMovieHumanHairCurl.VII]: [6.5, 9],
  [AutoMovieHumanHairCurl.VIII]: [7, 6],
};
