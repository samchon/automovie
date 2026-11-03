import type { AutoMovieHumanPolarSector } from "../../lofting/AutoMovieHumanPolarSector";
import { AutoMovieHumanLegProfile } from "./AutoMovieHumanLegProfile";
import type { AutoMovieHumanLegStations } from "./AutoMovieHumanLegStations";

/**
 * The posterolateral guide of the leg's section, at the section angle
 * 135 degrees (0 forward, increasing toward lateral on the left leg): a
 * longitudinal profile curve that runs down the leg through the biceps femoris on the
 * thigh and the lateral head of the gastrocnemius on the shank.
 *
 * The guide owns, along the whole leg, the section's radius `rho` in units of
 * the section's girth over 2 pi, and its first and second derivatives in the
 * section angle (radians): its point, tangent and curvature in every section
 * it crosses, which both neighbouring sectors copy (G2 across the guide). The
 * three channels are carried between the landmark rows by the natural cubic
 * spline (C2).
 */
export namespace AutoMovieHumanLegGuidePosterolateral {
  /** Section angle of the guide, radians. */
  export const ANGLE: number = 2.356194;

  /**
   * The landmark rows, `[rho, rho_theta, rho_thetatheta]`: the medians over the
   * four reference bodies f1, f2, m1 and m2 of the horizontal sections of the
   * left leg (the legs stand within 3.7 degrees of vertical), read about each
   * section's area centroid, the guide's values by least squares of a quadratic
   * over +-12 degrees about its angle. The largest held-out deviation of a
   * person's rho from the median of the other three is 0.0092 to 0.0855 on the thigh
   * rows and 0.0102 to 0.0479 on the shank rows. The thigh rows stand at 0.25 to 1
   * of the thigh from the hip centre (0.18 is the crotch ring), the shank rows
   * at 0.07 to 0.9 of the shank from the knee centre.
   */
  export const ROWS: readonly AutoMovieHumanLegProfile.IRow[] = [
    { segment: "shank", share: 0.07, values: [1.0332, 0.0567, -0.1161] },
    { segment: "shank", share: 0.15, values: [1.0266, 0.0326, -0.1929] },
    { segment: "shank", share: 0.25, values: [0.988, 0.0402, -0.0104] },
    { segment: "shank", share: 0.35, values: [0.9787, 0.0226, -0.0153] },
    { segment: "shank", share: 0.5, values: [0.9799, 0.0097, -0.0067] },
    { segment: "shank", share: 0.65, values: [0.9855, 0.065, -0.0144] },
    { segment: "shank", share: 0.8, values: [0.9212, 0.1672, 0.4002] },
    { segment: "shank", share: 0.9, values: [0.9029, 0.1246, 0.004] },
    { segment: "thigh", share: 0.25, values: [0.9546, 0.0561, 0.2049] },
    { segment: "thigh", share: 0.35, values: [0.9692, 0.0217, -0.0816] },
    { segment: "thigh", share: 0.5, values: [0.9416, 0.0762, 0.0653] },
    { segment: "thigh", share: 0.65, values: [0.9534, 0.1276, -0.0101] },
    { segment: "thigh", share: 0.8, values: [0.9868, 0.031, 0.322] },
    { segment: "thigh", share: 0.9, values: [0.9761, -0.0281, 0.6467] },
    { segment: "thigh", share: 1, values: [0.9888, 0.0643, 0.5558] },
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
