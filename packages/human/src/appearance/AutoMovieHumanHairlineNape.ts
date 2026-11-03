import type { AutoMovieHumanScalpLandmarks } from "./AutoMovieHumanScalpLandmarks";

/**
 * The nape hairline from behind the ear to the back midline: the lateral nape,
 * centred on the occiput, with knots at 122 and 140 degrees falling to -0.08
 * and -0.26 of the head height below the eyes, then the back midline (the
 * mirror line, where the boundary is level so the reflection is smooth) with
 * knots at 160 and 180 degrees at -0.32 and -0.33. Each share is scaled by
 * twice the measured eye-to-menton height (the earlier head-share convention,
 * unchanged). No published nape hairline height was found; the shares are
 * conventions (an open question in `docs/anatomy/hair.md`).
 */
export namespace AutoMovieHumanHairlineNape {
  /** `[azimuth degrees, share of the head height below the eyes]` from the lateral nape to the midline (convention). */
  export const SHARES: Array<[number, number]> = [
    [122, -0.08],
    [140, -0.26],
    [160, -0.32],
    [180, -0.33],
  ];

  /**
   * The nape's knots `[azimuth degrees, height above the eyes mm]`.
   *
   * @param landmarks The scalp's landmarks.
   * @returns Knots in increasing azimuth, the last at 180
   */
  export function knots(landmarks: AutoMovieHumanScalpLandmarks.ILandmarks): Array<[number, number]> {
    const below: number = landmarks.eyeLevel - landmarks.menton;
    return SHARES.map(([degrees, share]: [number, number]): [number, number] => [degrees, 2 * share * below]);
  }
}
