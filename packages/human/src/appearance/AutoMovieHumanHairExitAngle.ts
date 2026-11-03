import { AutoMovieHumanAppearanceNoise } from "./AutoMovieHumanAppearanceNoise";
import { AutoMovieHumanHairFeather } from "./AutoMovieHumanHairFeather";

/**
 * The angle at which a hair leaves the scalp, over the scalp surface, by
 * where it is rooted (Jung and Yun 2014, measured on patients): about 15 to
 * 20 degrees at the sideburn and the temporal point, 20 to 30 at the
 * supratemporal line, 30 to 45 at the lateral frontal line, 45 to 60 at the
 * central frontal line and 60 to 90 beside the parting. The zone values are
 * the midpoints of those ranges; the azimuths of the zones along the
 * hairline, from the front midline to the sideburn, are conventions of this
 * prototype. Beside a parting (within the hairline's transition zone width
 * of the line) the angle rises to the parting's, so the hair leaves the line
 * steeply and the two sides stand over it.
 */
export namespace AutoMovieHumanHairExitAngle {
  /** `[azimuth degrees, exit angle degrees]` along the hairline: central frontal to sideburn. */
  export const ZONES: Array<[number, number]> = [
    [0, 52.5],
    [30, 37.5],
    [60, 25],
    [80, 17.5],
  ];

  /** Exit angle beside a parting, degrees (the midpoint of 60 to 90). */
  export const PART: number = 75;

  /**
   * The exit angle of one root.
   *
   * @param azimuth Azimuth of the root from the front midline, degrees
   * @param part Distance from the parting line, millimetres, or null without
   *   a parting
   * @returns Exit angle in radians
   */
  export function angle(azimuth: number, part: number | null): number {
    const a: number = Math.abs(azimuth);
    let zone: number = ZONES[ZONES.length - 1]![1];
    if (a <= ZONES[0]![0]) zone = ZONES[0]![1];
    for (let k: number = 1; k < ZONES.length && a > ZONES[0]![0]; ++k) {
      const [a0, v0] = ZONES[k - 1]!;
      const [a1, v1] = ZONES[k]!;
      if (a <= a1) {
        zone = v0 + ((v1 - v0) * (a - a0)) / (a1 - a0);
        break;
      }
    }
    const near: number =
      part === null
        ? 0
        : 1 -
          AutoMovieHumanAppearanceNoise.smoothstep(
            0,
            AutoMovieHumanHairFeather.WIDTH,
            part,
          );
    return ((zone + (PART - zone) * near) * Math.PI) / 180;
  }
}
