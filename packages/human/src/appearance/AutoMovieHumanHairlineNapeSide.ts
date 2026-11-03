import type { AutoMovieHumanScalpLandmarks } from "./AutoMovieHumanScalpLandmarks";

/**
 * The lateral nape hairline, from behind the ear to the occiput, centred on
 * the occiput: knots at 122 and 140 degrees falling to -0.08 and -0.26 of
 * the head height below the eyes, scaled by twice the measured eye-to-menton
 * height (the earlier head-share convention, unchanged). No published nape
 * hairline height was found; both shares are conventions (an open question
 * in `docs/anatomy/hair.md`).
 */
export namespace AutoMovieHumanHairlineNapeSide {
  /** `[azimuth degrees, share of the head height below the eyes]` (convention). */
  export const SHARES: Array<[number, number]> = [
    [122, -0.08],
    [140, -0.26],
  ];

  /**
   * The lateral nape's knots `[azimuth degrees, height above the eyes mm]`.
   *
   * @param landmarks The head's landmarks
   * @returns Knots in increasing azimuth
   */
  export function knots(
    landmarks: AutoMovieHumanScalpLandmarks.ILandmarks,
  ): Array<[number, number]> {
    const below: number = landmarks.eyeLevel - landmarks.menton;
    return SHARES.map(
      ([degrees, share]: [number, number]): [number, number] => [
        degrees,
        2 * share * below,
      ],
    );
  }
}
