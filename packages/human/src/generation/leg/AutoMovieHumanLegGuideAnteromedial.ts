import type { AutoMovieHumanPolarSector } from "../../lofting/AutoMovieHumanPolarSector";
import { AutoMovieHumanLegProfile } from "./AutoMovieHumanLegProfile";
import type { AutoMovieHumanLegStations } from "./AutoMovieHumanLegStations";

/**
 * The anteromedial guide of the leg's section, at the section angle
 * 315 degrees (0 forward, increasing toward lateral on the left leg): a
 * longitudinal profile curve that runs down the leg through the vastus medialis and the sartorius on the
 * thigh and the edge of the subcutaneous medial tibial face on the shank.
 *
 * The guide owns, along the whole leg, the section's radius `rho` in units of
 * the section's girth over 2 pi, and its first and second derivatives in the
 * section angle (radians): its point, tangent and curvature in every section
 * it crosses, which both neighbouring sectors copy (G2 across the guide). The
 * three channels are carried between the landmark rows by the natural cubic
 * spline (C2).
 */
export namespace AutoMovieHumanLegGuideAnteromedial {
  /** Section angle of the guide, radians. */
  export const ANGLE: number = 5.497787;

  /**
   * The landmark rows, `[rho, rho_theta, rho_thetatheta]`: the medians over the
   * four reference bodies f1, f2, m1 and m2 of the horizontal sections of the
   * left leg (the legs stand within 3.7 degrees of vertical), read about each
   * section's area centroid, the guide's values by least squares of a quadratic
   * over +-12 degrees about its angle. The largest held-out deviation of a
   * person's rho from the median of the other three is 0.0208 to 0.0704 on the thigh
   * rows and 0.019 to 0.0855 on the shank rows. The thigh rows stand at 0.25 to 1
   * of the thigh from the hip centre (0.18 is the crotch ring), the shank rows
   * at 0.07 to 0.9 of the shank from the knee centre.
   */
  export const ROWS: readonly AutoMovieHumanLegProfile.IRow[] = [
    { segment: "shank", share: 0.07, values: [0.9025, 0.1251, 1.038] },
    { segment: "shank", share: 0.15, values: [0.9639, -0.0021, 0.3813] },
    { segment: "shank", share: 0.25, values: [0.9228, 0.0017, 0.6429] },
    { segment: "shank", share: 0.35, values: [0.8998, -0.1235, 0.6287] },
    { segment: "shank", share: 0.5, values: [0.9164, -0.1473, 0.3781] },
    { segment: "shank", share: 0.65, values: [0.9329, -0.0521, 0.4858] },
    { segment: "shank", share: 0.8, values: [0.9213, 0.2008, 0.4007] },
    { segment: "shank", share: 0.9, values: [0.9385, 0.3424, 0.304] },
    { segment: "thigh", share: 0.25, values: [0.9772, 0.0197, -0.0676] },
    { segment: "thigh", share: 0.35, values: [0.9405, -0.0321, 0.1691] },
    { segment: "thigh", share: 0.5, values: [0.9091, 0.0458, 0.4643] },
    { segment: "thigh", share: 0.65, values: [0.9517, 0.1657, 0.1795] },
    { segment: "thigh", share: 0.8, values: [0.9679, 0.1229, 0.1171] },
    { segment: "thigh", share: 0.9, values: [0.9267, 0.1874, 0.4579] },
    { segment: "thigh", share: 1, values: [0.8528, 0.1491, 1.2404] },
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
