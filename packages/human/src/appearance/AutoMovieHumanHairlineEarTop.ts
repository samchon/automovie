import type { AutoMovieHumanScalpLandmarks } from "./AutoMovieHumanScalpLandmarks";

/**
 * The hairline over the auricle, centred on the ear's root: the margin
 * stands {@link CLEAR} mm above the canonical auricle's top (superaurale), so
 * it follows the generated ear. The clearance is the width of the
 * hairline's transition zone (`AutoMovieHumanHairFeather`), so the thinning
 * hair above the ear ends at the helix instead of rooting on it; no
 * published distance from the helix to the hairline was found, so it is a
 * convention. Without an auricle the margin stands that clearance above the
 * eyes.
 */
export namespace AutoMovieHumanHairlineEarTop {
  /** Margin over the auricle's top, millimetres (convention). */
  export const CLEAR: number = 10;

  /** Azimuth of the margin over the ear, degrees (convention). */
  export const AZIMUTH: number = 94;

  /**
   * The margin's height above the eyes.
   *
   * @param landmarks The head's landmarks
   * @returns Height, millimetres
   */
  export function height(
    landmarks: AutoMovieHumanScalpLandmarks.ILandmarks,
  ): number {
    return (
      (landmarks.superaurale ?? landmarks.eyeLevel) - landmarks.eyeLevel + CLEAR
    );
  }

  /**
   * The margin's knot `[azimuth degrees, height above the eyes mm]`.
   *
   * @param landmarks The head's landmarks
   * @returns The knot
   */
  export function knot(
    landmarks: AutoMovieHumanScalpLandmarks.ILandmarks,
  ): [number, number] {
    return [AZIMUTH, height(landmarks)];
  }
}
