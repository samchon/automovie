import type { AutoMovieHumanPolarSector } from "../../lofting/AutoMovieHumanPolarSector";
import { AutoMovieHumanLegProfile } from "./AutoMovieHumanLegProfile";
import type { AutoMovieHumanLegStations } from "./AutoMovieHumanLegStations";

/**
 * The anterolateral guide of the leg's section, at the section angle
 * 45 degrees (0 forward, increasing toward lateral on the left leg): a
 * longitudinal profile curve that runs down the leg through the anterolateral maximum, where the rectus femoris meets the vastus lateralis on the
 * thigh and the anterior compartment's lateral edge, the tibialis anterior and the extensor mass on the shank.
 *
 * The guide owns, along the whole leg, the section's radius `rho` in units of
 * the section's girth over 2 pi, and its first and second derivatives in the
 * section angle (radians): its point, tangent and curvature in every section
 * it crosses, which both neighbouring sectors copy (G2 across the guide). The
 * three channels are carried between the landmark rows by the natural cubic
 * spline (C2).
 */
export namespace AutoMovieHumanLegGuideAnterolateral {
  /** Section angle of the guide, radians. */
  export const ANGLE: number = 0.785398;

  /**
   * The landmark rows, `[rho, rho_theta, rho_thetatheta]`: the medians over the
   * four reference bodies f1, f2, m1 and m2 of the horizontal sections of the
   * left leg (the legs stand within 3.7 degrees of vertical), read about each
   * section's area centroid, the guide's values by least squares of a quadratic
   * over +-12 degrees about its angle. The largest held-out deviation of a
   * person's rho from the median of the other three is 0.031 to 0.074 on the thigh
   * rows and 0.0117 to 0.0767 on the shank rows. The thigh rows stand at 0.25 to 1
   * of the thigh from the hip centre (0.18 is the crotch ring), the shank rows
   * at 0.07 to 0.9 of the shank from the knee centre.
   */
  export const ROWS: readonly AutoMovieHumanLegProfile.IRow[] = [
    { segment: "shank", share: 0.07, values: [0.9354, -0.2992, 0.565] },
    { segment: "shank", share: 0.15, values: [0.981, -0.1344, -0.0487] },
    { segment: "shank", share: 0.25, values: [1.0278, -0.1683, -0.2167] },
    { segment: "shank", share: 0.35, values: [1.0349, -0.1801, -0.0537] },
    { segment: "shank", share: 0.5, values: [1.0393, -0.157, -0.2079] },
    { segment: "shank", share: 0.65, values: [1.0337, -0.1315, -0.1826] },
    { segment: "shank", share: 0.8, values: [1.0383, -0.222, -0.223] },
    { segment: "shank", share: 0.9, values: [0.9723, -0.3221, 0.0617] },
    { segment: "thigh", share: 0.25, values: [1.03, -0.1394, -0.0877] },
    { segment: "thigh", share: 0.35, values: [1.0457, -0.1198, -0.1945] },
    { segment: "thigh", share: 0.5, values: [1.0571, -0.1361, -0.2999] },
    { segment: "thigh", share: 0.65, values: [1.0395, -0.0884, -0.2947] },
    { segment: "thigh", share: 0.8, values: [1.005, -0.09, 0.0015] },
    { segment: "thigh", share: 0.9, values: [0.9802, -0.2157, 0.1094] },
    { segment: "thigh", share: 1, values: [0.9398, -0.3824, 0.4723] },
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
