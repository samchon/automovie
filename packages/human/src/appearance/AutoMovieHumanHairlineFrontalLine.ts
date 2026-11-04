import type { AutoMovieHumanHairlineClass } from "./AutoMovieHumanHairlineClass";

/**
 * The lateral frontal line, from the trichion's neighbourhood to the
 * frontotemporal apex, centred on the forehead's transverse curve: the
 * class's knots between its first and its apex, azimuths scaled so the apex
 * stands on the exocanthion's sagittal plane
 * (`AutoMovieHumanHairlineApex.scale`) and heights as shares of the midline
 * height. Round is a smooth concave arc, rectangular level, M-shaped raised,
 * bell-shaped a dome, triangular descending nearly straight
 * (`AutoMovieHumanHairlineClass`, conventions between the sourced ends).
 */
export namespace AutoMovieHumanHairlineFrontalLine {
  /**
   * The line's knots `[azimuth degrees, height above the eyes mm]`.
   *
   * @param shape The class's shape
   * @param middle The trichion's height above the eyes, millimetres
   * @param scale The azimuth scale the apex fixes
   * @returns Knots in increasing azimuth
   */
  export function knots(
    shape: AutoMovieHumanHairlineClass.IShape,
    middle: number,
    scale: number,
  ): Array<[number, number]> {
    return shape.knots
      .slice(1, shape.apex)
      .map(([degrees, share]: [number, number]): [number, number] => [
        degrees * scale,
        middle * share,
      ]);
  }
}
