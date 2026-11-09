/**
 * The plan of the ISO 8559-1 5.3.3 neck-base loop: the interim for the neck
 * base's depth (IJ to C7, horizontal) and breadth (side neck point to side
 * neck point). Both are input gaps: no published neck-base depth or breadth
 * has been read (searched: ANSUR, AIST definitions, Size Korea secondary
 * studies), so a prior fills them from the girth.
 *
 * The loop passes over C7 and both side neck points at the cervicale height
 * (ANSUR side neck height lies within a millimetre of it; S00's end holds all
 * three there) and over IJ the rise `h` below (cervicale less suprasternale
 * height): a saddle, not a planar curve. The prior is isotropic in plan, a
 * circle of radius `r` about the neck's centre: C7 and IJ at `-r` and `+r`
 * along X, the side neck points at `+-r` along Z. A tape laid round that
 * circular neck is taut on a convex cylinder, so it is the cylinder's
 * geodesic: the back half level (`pi r`), each front quarter a helix of plan
 * length `pi r / 2` over the drop `h`. Its length is the girth `G`:
 *
 *     G = pi r + 2 sqrt((pi r / 2)^2 + h^2)
 *     (G - pi r)^2 = (pi r)^2 + 4 h^2   =>   pi r = (G^2 - 4 h^2) / (2 G)
 *
 * (`G > 2 h` for every tape: it climbs the rise and returns). It replaces the
 * planar circle of the girth in the C7-IJ plane (C7-IJ spatial distance and
 * side-neck-point breadth both `G / pi`). That circle ignored the saddle: it
 * left the side neck points `h / 2` above its centre, and no tape through the
 * four points could be as short as the girth (f1, 2026-11-08: the end's level
 * back half 160.0 mm plus the two straight SNP-IJ chords 100.2 mm each give
 * at least 360.4 against 356.2; the surface tape read 373.6).
 */
export namespace AutoMovieHumanTrunkNeckBasePlan {
  /** The plan's readings, mm. */
  export interface IOutput {
    /** The plan circle's radius. */
    radius: number;

    /** C7 behind IJ, horizontal: the plan's diameter. */
    depth: number;

    /** Each side neck point's distance from the midline: the plan's radius. */
    half: number;

    /** Basis of the readings, for the landmark records. */
    basis: string;
  }

  /** The plan from the ISO 8559-1 neck-base girth and the C7-IJ rise (cervicale less suprasternale height), mm. */
  export function of(girth: number, rise: number): IOutput {
    if (!(girth > 2 * rise && rise >= 0)) throw new Error(`neck-base plan: the girth ${girth.toFixed(1)} mm cannot climb the C7-IJ rise ${rise.toFixed(1)} mm and return`);
    const radius: number = (girth * girth - 4 * rise * rise) / (2 * Math.PI * girth);
    return {
      radius,
      depth: 2 * radius,
      half: radius,
      basis: `the neck-base loop's isotropic plan (input gap: neck base depth and breadth): a circle of radius ${radius.toFixed(1)} mm whose taut tape, level behind and helical over the ${rise.toFixed(1)} mm C7-IJ rise in front, is the ISO girth`,
    };
  }
}
