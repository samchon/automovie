import type { AutoMovieHumanPolarSector } from "../../lofting/AutoMovieHumanPolarSector";
import { AutoMovieHumanLegProfile } from "./AutoMovieHumanLegProfile";
import type { AutoMovieHumanLegStations } from "./AutoMovieHumanLegStations";

/**
 * The lateral guide of the leg's section, at the section angle
 * 90 degrees (0 forward, increasing toward lateral on the left leg): a
 * longitudinal profile curve that runs down the leg through the iliotibial band, flat on the
 * thigh and the fibular line between the extensor and the peroneal mass on the shank.
 *
 * The guide owns, along the whole leg, the section's radius `rho` in units of
 * the section's girth over 2 pi, and its first and second derivatives in the
 * section angle (radians): its point, tangent and curvature in every section
 * it crosses, which both neighbouring sectors copy (G2 across the guide). The
 * three channels are carried between the landmark rows by the natural cubic
 * spline (C2).
 */
export namespace AutoMovieHumanLegGuideLateral {
  /** Section angle of the guide, radians. */
  export const ANGLE: number = 1.570796;

  /**
   * The landmark rows, `[rho, rho_theta, rho_thetatheta]`: the medians over the
   * four reference bodies f1, f2, m1 and m2 of the horizontal sections of the
   * left leg (the legs stand within 3.7 degrees of vertical), read about each
   * section's area centroid, the guide's values by least squares of a quadratic
   * over +-12 degrees about its angle. The largest held-out deviation of a
   * person's rho from the median of the other three is 0.0149 to 0.043 on the thigh
   * rows and 0.0206 to 0.0402 on the shank rows. The thigh rows stand at 0.25 to 1
   * of the thigh from the hip centre (0.18 is the crotch ring), the shank rows
   * at 0.07 to 0.9 of the shank from the knee centre.
   */
  export const ROWS: readonly AutoMovieHumanLegProfile.IRow[] = [
    { segment: "shank", share: 0.07, values: [0.8993, 0.1946, 0.5469] },
    { segment: "shank", share: 0.15, values: [0.928, 0.12, 0.2946] },
    { segment: "shank", share: 0.25, values: [0.9451, 0.0122, 0.3037] },
    { segment: "shank", share: 0.35, values: [0.9554, -0.0102, 0.2559] },
    { segment: "shank", share: 0.5, values: [0.9702, 0.0023, 0.088] },
    { segment: "shank", share: 0.65, values: [0.954, -0.023, 0.2044] },
    { segment: "shank", share: 0.8, values: [0.8897, -0.0722, 0.3923] },
    { segment: "shank", share: 0.9, values: [0.8117, -0.0032, 0.5051] },
    { segment: "thigh", share: 0.25, values: [0.9452, -0.0426, 0.1866] },
    { segment: "thigh", share: 0.35, values: [0.9606, -0.0396, 0.1761] },
    { segment: "thigh", share: 0.5, values: [0.9465, -0.0898, 0.1832] },
    { segment: "thigh", share: 0.65, values: [0.9298, -0.1167, 0.268] },
    { segment: "thigh", share: 0.8, values: [0.9394, 0.0015, 0.5826] },
    { segment: "thigh", share: 0.9, values: [0.9482, 0.1628, 0.192] },
    { segment: "thigh", share: 1, values: [0.9223, 0.25, -0.0865] },
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
