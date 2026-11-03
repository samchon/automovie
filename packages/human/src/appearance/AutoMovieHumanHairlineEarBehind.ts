import { AutoMovieHumanHairlineEarTop } from "./AutoMovieHumanHairlineEarTop";
import type { AutoMovieHumanScalpLandmarks } from "./AutoMovieHumanScalpLandmarks";

/**
 * The hairline behind the auricle, centred on the mastoid: the margin keeps
 * the height it has over the ear (`AutoMovieHumanHairlineEarTop`) to this
 * azimuth, where it turns down to the nape (convention of this prototype; no
 * published distance behind the ear was found).
 */
export namespace AutoMovieHumanHairlineEarBehind {
  /** Azimuth of the margin behind the ear, degrees (convention). */
  export const AZIMUTH: number = 108;

  /**
   * The margin's knot `[azimuth degrees, height above the eyes mm]`.
   *
   * @param landmarks The head's landmarks
   * @returns The knot
   */
  export function knot(
    landmarks: AutoMovieHumanScalpLandmarks.ILandmarks,
  ): [number, number] {
    return [AZIMUTH, AutoMovieHumanHairlineEarTop.height(landmarks)];
  }
}
