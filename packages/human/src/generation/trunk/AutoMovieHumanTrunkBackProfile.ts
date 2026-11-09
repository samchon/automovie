import { AutoMovieHumanBackProfile } from "../AutoMovieHumanBackProfile";
import type { IAutoMovieHumanBodyMeasures } from "../IAutoMovieHumanBodyMeasures";
import type { AutoMovieHumanTrunkViewScalar } from "./AutoMovieHumanTrunkViewScalar";

/**
 * The back midline's datums for S00's posterior outline (the skin over the
 * spinous processes), as world heights with fixed values, slopes `dx/dy` and
 * curvatures `d2x/dy2`. World +X is anterior, so `dx/dy > 0` means the line
 * runs backward as it descends.
 *
 * Source: the circular-arc back line `AutoMovieHumanBackProfile` (Ohlendorf
 * et al., Sci Rep 13:873, 2023, 407 women: thoracic bending angle and trunk
 * length; Gray 1918's thoracic-to-lumbar column split 28 : 18; the person's
 * kyphotic and lordotic inputs, DIERS surface tangents between inflections,
 * defaults Bioengineering 2022, PMC9774435, Table 4). Its five knots become
 * the datums: VP (cervicale), the kyphosis apex (most posterior, the
 * thoracic arc's curvature `1 / R1`), the thoracolumbar inflection ITL, the
 * lordosis apex (most anterior, `-1 / R2`), and the PSIS level, each with
 * the model's value and slope.
 *
 * Curvature zero at VP, ITL and the PSIS level: DIERS measures its angles
 * between the cervicothoracic (ICT), thoracolumbar (ITL) and lumbosacral
 * (ILS) inflections, and the arc model starts the kyphosis at C7 (ICT at VP:
 * above it the neck's lordosis turns the other way) and ends the lordosis at
 * the PSIS level (below it the sacrum turns the other way), so those three
 * knots are the line's inflections.
 *
 * Tried and replaced: DIERS datums with ICT two vertebral levels below VP,
 * the tangents symmetric about the VP-DM line and free curvature at the
 * inflections. Its rendered line read 19.5 degrees of thoracic bending
 * against the published 13.9, kyphosis 51.2 against 50.1, and lordosis 45.3
 * against 44.0 (`test_human_trunk_back_line`, red, 2026-11-08 04:45).
 */
export namespace AutoMovieHumanTrunkBackProfile {
  /** Site names of the arc model's knots. */
  export const SITES: Readonly<Record<AutoMovieHumanBackProfile.IKnot["name"], string>> = {
    cervicale: "VP (ICT)",
    kyphosisApex: "kyphosis apex",
    inflection: "ITL",
    lordosisApex: "lordosis apex",
    psis: "PSIS level (ILS)",
  };

  /**
   * The back midline datums, bottom to top (PSIS level up to VP).
   *
   * @param measures The person's resolved measures (cervicale height, stature, sex, posture inputs).
   * @param vp VP's world X, mm.
   */
  export function create(measures: IAutoMovieHumanBodyMeasures, vp: number): AutoMovieHumanTrunkViewScalar.IDatum[] {
    const profile: AutoMovieHumanBackProfile.IProfile = AutoMovieHumanBackProfile.of(measures);
    const inflection: ReadonlySet<string> = new Set<string>(["cervicale", "inflection", "psis"]);
    return [...profile.knots].reverse().map(
      (k: AutoMovieHumanBackProfile.IKnot): AutoMovieHumanTrunkViewScalar.IDatum => ({
        site: SITES[k.name],
        y: k.y,
        value: vp + k.x,
        slope: k.slope,
        second: inflection.has(k.name) ? 0 : k.curvature,
        rule: inflection.has(k.name)
          ? `circular-arc back line (Ohlendorf 2023; Gray 28 : 18; posture inputs): value and lean; an inflection, curvature zero`
          : `circular-arc back line (Ohlendorf 2023; Gray 28 : 18; posture inputs): value, zero slope and the arc's curvature ${k.curvature.toExponential(4)} per mm`,
      }),
    );
  }
}
