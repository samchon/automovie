/**
 * The angle at which a hair leaves the scalp, over the scalp surface, by
 * where it is rooted along the hairline (Jung and Yun 2014, measured on
 * patients at the hairline): about 15 to 20 degrees at the sideburn and the
 * temporal point, 20 to 30 at the supratemporal line, 30 to 45 at the
 * lateral frontal line and 45 to 60 at the central frontal line. The zone
 * values are the midpoints of those ranges; the azimuths of the zones along
 * the hairline, from the front midline to the sideburn, are conventions of
 * this prototype.
 *
 * The angles are measured at the hairline, so they act in its transition
 * zone and fade into the mass with the root's feather
 * (`AutoMovieHumanHairFeather`): a root at the boundary leaves at its zone's
 * angle, a root at the zone's inner edge and beyond lies in its comb. A free
 * fibre at those angles stands nearly straight when it is not much longer
 * than its bending length (`AutoMovieHumanHairBending`), but inside the mass
 * the comb and the hair above lay it down; applied by azimuth to every root,
 * the angles stood a 50 mm crop 34 mm high along the front midline up to the
 * vertex and a 70 mm short cut 63 mm high along its side parting (60 to 90
 * degrees there, Jung and Yun), a crest like a mohawk.
 */
export namespace AutoMovieHumanHairExitAngle {
  /** `[azimuth degrees, exit angle degrees]` along the hairline: central frontal to sideburn. */
  export const ZONES: Array<[number, number]> = [
    [0, 52.5],
    [30, 37.5],
    [60, 25],
    [80, 17.5],
  ];

  /**
   * The exit angle of one root.
   *
   * @param azimuth Azimuth of the root from the front midline, degrees
   * @param feather The root's feather, 0 at the boundary to 1 inside the mass
   * @returns Exit angle in radians
   */
  export function angle(azimuth: number, feather: number): number {
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
    const share: number = 1 - Math.min(1, Math.max(0, feather));
    return (zone * share * Math.PI) / 180;
  }
}
