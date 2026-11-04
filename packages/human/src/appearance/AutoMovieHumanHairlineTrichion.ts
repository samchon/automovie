import { AutoMovieHumanHairline } from "../typings/AutoMovieHumanHairline";
import type { AutoMovieHumanHairlineClass } from "./AutoMovieHumanHairlineClass";
import type { AutoMovieHumanHeadField } from "./AutoMovieHumanHeadField";
import type { AutoMovieHumanScalpLandmarks } from "./AutoMovieHumanScalpLandmarks";
import { AutoMovieHumanScalpSurface } from "./AutoMovieHumanScalpSurface";
import type { AutoMovieHumanSkinVector } from "./AutoMovieHumanSkinVector";

/**
 * The trichion, the hairline's midline point, centre of the forehead's
 * sagittal profile.
 *
 * It is the front midline skin point whose straight distance from the nasion
 * is the forehead height tr-n = {@link FOREHEAD} sn-me. The ratio of tr-n to
 * the lower face sn-me is 0.913 to 0.980 in the six measured groups of Virdi
 * 2019 (Kenyan, and Farkas's North American white and African American
 * norms, both sexes), mean 0.945, far tighter across populations than tr-n
 * itself; it is the classical canon of facial thirds that hairline design
 * uses (Jung and Yun 2014). The bell-shaped class puts the midpoint
 * {@link BELL} mm further along the midline skin, as its definition reads
 * (Zhang 2026: "midpoint about 2 cm higher than the population average").
 * The nasion is the head's published one, read as given
 * (`AutoMovieHumanScalpNasion`).
 */
export namespace AutoMovieHumanHairlineTrichion {
  /** Forehead height tr-n over the lower face sn-me (Virdi 2019, six groups, derived). */
  export const FOREHEAD: number = 0.945;

  /** Rise of the bell-shaped midpoint along the midline skin, mm (Zhang 2026, measured preference). */
  export const BELL: number = 20;

  /**
   * The trichion's model height for a class.
   *
   * @param hairline Frontal hairline class
   * @param field Head chart
   * @param landmarks The head's landmarks
   * @returns Model height, millimetres
   */
  export function height(
    hairline: AutoMovieHumanHairline,
    field: AutoMovieHumanHeadField.IField,
    landmarks: AutoMovieHumanScalpLandmarks.ILandmarks,
  ): number {
    const n: AutoMovieHumanSkinVector.Vec3 = landmarks.nasion;
    const forehead: number = FOREHEAD * landmarks.lowerFace;
    const distance: (height: number) => number = (height: number): number => {
      const p: AutoMovieHumanSkinVector.Vec3 | null =
        AutoMovieHumanScalpSurface.front(field, height);
      return p === null
        ? Infinity
        : Math.hypot(p[0] - n[0], p[1] - n[1], p[2] - n[2]);
    };

    // Bisection on height between the nasion and the vertex: the straight
    // distance from the nasion grows up the forehead.
    let low: number = field.centre[1] + n[1];
    let high: number = landmarks.vertex - 1;
    for (let k: number = 0; k < 40; ++k) {
      const mid: number = (low + high) / 2;
      if (distance(mid) < forehead) low = mid;
      else high = mid;
    }
    if (hairline !== AutoMovieHumanHairline.BellShaped) return high;

    // Bell: walk the midline skin BELL mm further up, in 0.25 mm of height.
    let rise: number = high;
    let previous: AutoMovieHumanSkinVector.Vec3 | null =
      AutoMovieHumanScalpSurface.front(field, rise);
    let arc: number = 0;
    while (previous !== null && arc < BELL && rise < landmarks.vertex - 1) {
      rise += 0.25;
      const p: AutoMovieHumanSkinVector.Vec3 | null =
        AutoMovieHumanScalpSurface.front(field, rise);
      if (p === null) break;
      arc += Math.hypot(
        p[0] - previous[0],
        p[1] - previous[1],
        p[2] - previous[2],
      );
      previous = p;
    }
    return rise;
  }

  /**
   * The midline knot `[azimuth, height above the eyes]`.
   *
   * @param shape The class's shape
   * @param middle The trichion's height above the eyes, millimetres
   * @returns The knot at the front midline
   */
  export function knots(
    shape: AutoMovieHumanHairlineClass.IShape,
    middle: number,
  ): Array<[number, number]> {
    return [[0, middle * shape.knots[0]![1]]];
  }
}
