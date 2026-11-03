import type { AutoMovieHumanPolarSector } from "../../lofting/AutoMovieHumanPolarSector";
import { AutoMovieHumanLegProfile } from "./AutoMovieHumanLegProfile";
import type { AutoMovieHumanLegStations } from "./AutoMovieHumanLegStations";

/**
 * The medial guide of the leg's section, at the section angle
 * 270 degrees (0 forward, increasing toward lateral on the left leg): a
 * longitudinal profile curve that runs down the leg through the adductors and the gracilis on the
 * thigh and the soleus' medial edge and the tibia's medial border on the shank.
 *
 * The guide owns, along the whole leg, the section's radius `rho` in units of
 * the section's girth over 2 pi, and its first and second derivatives in the
 * section angle (radians): its point, tangent and curvature in every section
 * it crosses, which both neighbouring sectors copy (G2 across the guide). The
 * three channels are carried between the landmark rows by the natural cubic
 * spline (C2).
 */
export namespace AutoMovieHumanLegGuideMedial {
  /** Section angle of the guide, radians. */
  export const ANGLE: number = 4.712389;

  /**
   * The landmark rows, `[rho, rho_theta, rho_thetatheta]`: the medians over the
   * four reference bodies f1, f2, m1 and m2 of the horizontal sections of the
   * left leg (the legs stand within 3.7 degrees of vertical), read about each
   * section's area centroid, the guide's values by least squares of a quadratic
   * over +-12 degrees about its angle. The largest held-out deviation of a
   * person's rho from the median of the other three is 0.0245 to 0.0744 on the thigh
   * rows and 0.0124 to 0.0812 on the shank rows. The thigh rows stand at 0.25 to 1
   * of the thigh from the hip centre (0.18 is the crotch ring), the shank rows
   * at 0.07 to 0.9 of the shank from the knee centre.
   */
  export const ROWS: readonly AutoMovieHumanLegProfile.IRow[] = [
    { segment: "shank", share: 0.07, values: [0.996, -0.134, -0.4571] },
    { segment: "shank", share: 0.15, values: [0.9919, 0.0283, -0.1462] },
    { segment: "shank", share: 0.25, values: [0.9978, -0.0638, -0.0847] },
    { segment: "shank", share: 0.35, values: [1.019, -0.0535, -0.1966] },
    { segment: "shank", share: 0.5, values: [1.0183, -0.0772, -0.1832] },
    { segment: "shank", share: 0.65, values: [1.0045, -0.0263, -0.1475] },
    { segment: "shank", share: 0.8, values: [0.8971, -0.1068, 0.268] },
    { segment: "shank", share: 0.9, values: [0.7789, 0.029, 0.3268] },
    { segment: "thigh", share: 0.25, values: [0.943, -0.0068, 0.3631] },
    { segment: "thigh", share: 0.35, values: [0.9817, -0.0873, 0.1999] },
    { segment: "thigh", share: 0.5, values: [0.971, -0.1367, 0.0996] },
    { segment: "thigh", share: 0.65, values: [0.9285, -0.1072, 0.1472] },
    { segment: "thigh", share: 0.8, values: [0.9516, -0.0823, 0.1876] },
    { segment: "thigh", share: 0.9, values: [0.9671, -0.2205, -0.1075] },
    { segment: "thigh", share: 1, values: [0.9849, -0.2464, -0.4072] },
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
