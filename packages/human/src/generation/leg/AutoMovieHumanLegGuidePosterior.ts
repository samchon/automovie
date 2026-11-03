import type { AutoMovieHumanPolarSector } from "../../lofting/AutoMovieHumanPolarSector";
import { AutoMovieHumanLegProfile } from "./AutoMovieHumanLegProfile";
import type { AutoMovieHumanLegStations } from "./AutoMovieHumanLegStations";

/**
 * The posterior guide of the leg's section, at the section angle
 * 180 degrees (0 forward, increasing toward lateral on the left leg): a
 * longitudinal profile curve that runs down the leg through the hamstring cleft on the
 * thigh and the cleft between the gastrocnemius heads, then the Achilles midline on the shank.
 *
 * The guide owns, along the whole leg, the section's radius `rho` in units of
 * the section's girth over 2 pi, and its first and second derivatives in the
 * section angle (radians): its point, tangent and curvature in every section
 * it crosses, which both neighbouring sectors copy (G2 across the guide). The
 * three channels are carried between the landmark rows by the natural cubic
 * spline (C2).
 */
export namespace AutoMovieHumanLegGuidePosterior {
  /** Section angle of the guide, radians. */
  export const ANGLE: number = 3.141593;

  /**
   * The landmark rows, `[rho, rho_theta, rho_thetatheta]`: the medians over the
   * four reference bodies f1, f2, m1 and m2 of the horizontal sections of the
   * left leg (the legs stand within 3.7 degrees of vertical), read about each
   * section's area centroid, the guide's values by least squares of a quadratic
   * over +-12 degrees about its angle. The largest held-out deviation of a
   * person's rho from the median of the other three is 0.0093 to 0.0393 on the thigh
   * rows and 0.0079 to 0.0502 on the shank rows. The thigh rows stand at 0.25 to 1
   * of the thigh from the hip centre (0.18 is the crotch ring), the shank rows
   * at 0.07 to 0.9 of the shank from the knee centre.
   */
  export const ROWS: readonly AutoMovieHumanLegProfile.IRow[] = [
    { segment: "shank", share: 0.07, values: [1.0218, -0.1444, -0.4632] },
    { segment: "shank", share: 0.15, values: [1.0259, -0.0103, -0.1061] },
    { segment: "shank", share: 0.25, values: [1.0046, 0.0118, 0.0948] },
    { segment: "shank", share: 0.35, values: [0.9858, 0.0243, 0.1954] },
    { segment: "shank", share: 0.5, values: [0.9793, 0.0083, 0.1161] },
    { segment: "shank", share: 0.65, values: [1.0103, 0.0102, -0.02] },
    { segment: "shank", share: 0.8, values: [1.0907, 0.1109, -0.5334] },
    { segment: "shank", share: 0.9, values: [1.1846, 0.3356, -1.8249] },
    { segment: "thigh", share: 0.25, values: [1.0465, 0.1027, -0.258] },
    { segment: "thigh", share: 0.35, values: [0.999, 0.0635, 0.0826] },
    { segment: "thigh", share: 0.5, values: [1.0209, 0.0889, -0.0545] },
    { segment: "thigh", share: 0.65, values: [1.0543, 0.0635, -0.3035] },
    { segment: "thigh", share: 0.8, values: [1.0218, -0.0321, 0.0225] },
    { segment: "thigh", share: 0.9, values: [0.996, -0.0828, -0.0178] },
    { segment: "thigh", share: 1, values: [0.9926, -0.1697, -0.2676] },
  ];

  /**
   * The guide along the leg.
   *
   * @param bones The joints' heights, which place the rows.
   * @param ends The neighbours' rings as the first and last rows, [rho, rho_theta, rho_thetatheta] each.
   * @returns The guide at a station: its angle, radius and the two angle derivatives.
   */
  export function profile(bones: AutoMovieHumanLegStations.IBones, ends: AutoMovieHumanLegProfile.IEnds = {}): (s: number) => AutoMovieHumanPolarSector.IGuide {
    const value: AutoMovieHumanLegProfile.Channel = AutoMovieHumanLegProfile.channel(ROWS, bones, 0, ends);
    const slope: AutoMovieHumanLegProfile.Channel = AutoMovieHumanLegProfile.channel(ROWS, bones, 1, ends);
    const curvature: AutoMovieHumanLegProfile.Channel = AutoMovieHumanLegProfile.channel(ROWS, bones, 2, ends);
    return (s: number): AutoMovieHumanPolarSector.IGuide => ({
      angle: ANGLE,
      value: value(s),
      slope: slope(s),
      curvature: curvature(s),
    });
  }
}
