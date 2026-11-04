import type { AutoMovieHumanHairlineClass } from "./AutoMovieHumanHairlineClass";
import type { AutoMovieHumanHeadField } from "./AutoMovieHumanHeadField";
import type { AutoMovieHumanScalpLandmarks } from "./AutoMovieHumanScalpLandmarks";
import { AutoMovieHumanScalpSurface } from "./AutoMovieHumanScalpSurface";

/**
 * The frontotemporal apex, where the frontal line meets the temple (the
 * corner of a rectangular line, the recession of an M), centred on the
 * vertical through the exocanthion: the temporal recession's apex aligns
 * with the lateral canthus in the frontal view (Jung and Yun 2014 after
 * Nusbaum; the frontal view of Garg 2017's rule of eight). Its azimuth is
 * where the skin at the apex's height stands the exocanthion's distance from
 * the midline; the class's knots from the apex on (its corner and what
 * follows) are scaled by it.
 */
export namespace AutoMovieHumanHairlineApex {
  /**
   * The azimuth scale the apex fixes on the class's knots.
   *
   * @param shape The class's shape
   * @param field Head chart
   * @param landmarks The head's landmarks
   * @param middle The trichion's height above the eyes, millimetres
   * @returns Azimuth scale; 1 where the head is narrower than its canthi at
   *   that height (the class keeps its own azimuth there)
   */
  export function scale(
    shape: AutoMovieHumanHairlineClass.IShape,
    field: AutoMovieHumanHeadField.IField,
    landmarks: AutoMovieHumanScalpLandmarks.ILandmarks,
    middle: number,
  ): number {
    const apex: [number, number] = shape.knots[shape.apex]!;
    const alpha: number | null = AutoMovieHumanScalpSurface.azimuth(
      field,
      landmarks.midline,
      landmarks.eyeLevel + middle * apex[1],
      landmarks.exocanthion,
    );
    return alpha === null ? 1 : (alpha * 180) / Math.PI / apex[0];
  }

  /**
   * The knots from the apex on, `[azimuth degrees, height above the eyes mm]`.
   *
   * @param shape The class's shape
   * @param middle The trichion's height above the eyes, millimetres
   * @param scale The azimuth scale {@link scale} gives
   * @returns Knots in increasing azimuth
   */
  export function knots(
    shape: AutoMovieHumanHairlineClass.IShape,
    middle: number,
    scale: number,
  ): Array<[number, number]> {
    return shape.knots
      .slice(shape.apex)
      .map(([degrees, share]: [number, number]): [number, number] => [
        degrees * scale,
        middle * share,
      ]);
  }
}
