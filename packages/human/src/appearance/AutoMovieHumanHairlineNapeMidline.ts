import type { AutoMovieHumanScalpLandmarks } from "./AutoMovieHumanScalpLandmarks";

/**
 * The nape hairline at the back midline, centred on the back midline (the
 * mirror line, where the boundary is level so the reflection is smooth):
 * knots at 160 and 180 degrees at -0.32 and -0.33 of the head height below
 * the eyes, scaled by twice the measured eye-to-menton height (the earlier
 * head-share convention, unchanged; an open question in
 * `docs/anatomy/hair.md`).
 */
export namespace AutoMovieHumanHairlineNapeMidline {
  /** `[azimuth degrees, share of the head height below the eyes]` (convention). */
  export const SHARES: Array<[number, number]> = [
    [160, -0.32],
    [180, -0.33],
  ];

  /**
   * The midline nape's knots `[azimuth degrees, height above the eyes mm]`.
   *
   * @param landmarks The head's landmarks
   * @returns Knots in increasing azimuth, the last at 180
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
