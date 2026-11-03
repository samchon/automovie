import type { AutoMovieHumanPolarSector } from "../../lofting/AutoMovieHumanPolarSector";
import { AutoMovieHumanLegProfile } from "./AutoMovieHumanLegProfile";
import type { AutoMovieHumanLegStations } from "./AutoMovieHumanLegStations";

/**
 * The posteromedial guide of the leg's section, at the section angle
 * 225 degrees (0 forward, increasing toward lateral on the left leg): a
 * longitudinal profile curve that runs down the leg through the posteromedial maximum, the semitendinosus and semimembranosus on the
 * thigh and the medial head of the gastrocnemius on the shank.
 *
 * The guide owns, along the whole leg, the section's radius `rho` in units of
 * the section's girth over 2 pi, and its first and second derivatives in the
 * section angle (radians): its point, tangent and curvature in every section
 * it crosses, which both neighbouring sectors copy (G2 across the guide). The
 * three channels are carried between the landmark rows by the natural cubic
 * spline (C2).
 */
export namespace AutoMovieHumanLegGuidePosteromedial {
  /** Section angle of the guide, radians. */
  export const ANGLE: number = 3.926991;

  /**
   * The landmark rows, `[rho, rho_theta, rho_thetatheta]`: the medians over the
   * four reference bodies f1, f2, m1 and m2 of the horizontal sections of the
   * left leg (the legs stand within 3.7 degrees of vertical), read about each
   * section's area centroid, the guide's values by least squares of a quadratic
   * over +-12 degrees about its angle. The largest held-out deviation of a
   * person's rho from the median of the other three is 0.0221 to 0.0571 on the thigh
   * rows and 0.0057 to 0.0577 on the shank rows. The thigh rows stand at 0.25 to 1
   * of the thigh from the hip centre (0.18 is the crotch ring), the shank rows
   * at 0.07 to 0.9 of the shank from the knee centre.
   */
  export const ROWS: readonly AutoMovieHumanLegProfile.IRow[] = [
    { segment: "shank", share: 0.07, values: [0.9468, 0.15, 0.3508] },
    { segment: "shank", share: 0.15, values: [0.9618, -0.0327, 0.4617] },
    { segment: "shank", share: 0.25, values: [1.0146, -0.0069, 0.0605] },
    { segment: "shank", share: 0.35, values: [1.0206, 0.0253, -0.0025] },
    { segment: "shank", share: 0.5, values: [1.0235, 0.0616, -0.1059] },
    { segment: "shank", share: 0.65, values: [1.0084, -0.0116, -0.0088] },
    { segment: "shank", share: 0.8, values: [1.03, -0.2061, -0.1009] },
    { segment: "shank", share: 0.9, values: [0.9464, -0.4872, 0.5836] },
    { segment: "thigh", share: 0.25, values: [1.0234, -0.1372, -0.0322] },
    { segment: "thigh", share: 0.35, values: [1.0459, 0.0187, -0.234] },
    { segment: "thigh", share: 0.5, values: [1.0555, -0.0199, -0.2185] },
    { segment: "thigh", share: 0.65, values: [1.0396, -0.1047, -0.2322] },
    { segment: "thigh", share: 0.8, values: [1.0213, -0.0449, -0.2341] },
    { segment: "thigh", share: 0.9, values: [1.0312, 0.0578, -0.3393] },
    { segment: "thigh", share: 1, values: [1.0067, 0.1734, -0.3931] },
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
