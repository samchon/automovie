import type { AutoMovieHumanPolarSector } from "../../lofting/AutoMovieHumanPolarSector";
import { AutoMovieHumanLegProfile } from "./AutoMovieHumanLegProfile";
import type { AutoMovieHumanLegStations } from "./AutoMovieHumanLegStations";

/**
 * The anterior guide of the leg's section, at the section angle
 * 0 degrees (0 forward, increasing toward lateral on the left leg): a
 * longitudinal profile curve that runs down the leg through the rectus femoris crest on the
 * thigh and the tibial crest, the anterior border on the shank.
 *
 * The guide owns, along the whole leg, the section's radius `rho` in units of
 * the section's girth over 2 pi, and its first and second derivatives in the
 * section angle (radians): its point, tangent and curvature in every section
 * it crosses, which both neighbouring sectors copy (G2 across the guide). The
 * three channels are carried between the landmark rows by the natural cubic
 * spline (C2).
 */
export namespace AutoMovieHumanLegGuideAnterior {
  /** Section angle of the guide, radians. */
  export const ANGLE: number = 0.000000;

  /**
   * The landmark rows, `[rho, rho_theta, rho_thetatheta]`: the medians over the
   * four reference bodies f1, f2, m1 and m2 of the horizontal sections of the
   * left leg (the legs stand within 3.7 degrees of vertical), read about each
   * section's area centroid, the guide's values by least squares of a quadratic
   * over +-12 degrees about its angle. The largest held-out deviation of a
   * person's rho from the median of the other three is 0.0129 to 0.0615 on the thigh
   * rows and 0.0211 to 0.0799 on the shank rows. The thigh rows stand at 0.25 to 1
   * of the thigh from the hip centre (0.18 is the crotch ring), the shank rows
   * at 0.07 to 0.9 of the shank from the knee centre.
   */
  export const ROWS: readonly AutoMovieHumanLegProfile.IRow[] = [
    { segment: "shank", share: 0.07, values: [1.0988, 0.0411, -0.6686] },
    { segment: "shank", share: 0.15, values: [1.0695, 0.066, -0.7805] },
    { segment: "shank", share: 0.25, values: [1.0396, 0.1253, -0.3777] },
    { segment: "shank", share: 0.35, values: [1.0269, 0.2272, -0.4977] },
    { segment: "shank", share: 0.5, values: [1.0182, 0.2184, -0.4756] },
    { segment: "shank", share: 0.65, values: [1.0346, 0.141, -0.4342] },
    { segment: "shank", share: 0.8, values: [1.0877, 0.1047, -0.3056] },
    { segment: "shank", share: 0.9, values: [1.1409, -0.0007, -0.8041] },
    { segment: "thigh", share: 0.25, values: [1.0265, 0.1408, -0.0281] },
    { segment: "thigh", share: 0.35, values: [1.0196, 0.1652, -0.1947] },
    { segment: "thigh", share: 0.5, values: [1.0421, 0.1507, -0.2669] },
    { segment: "thigh", share: 0.65, values: [1.0521, 0.0298, -0.1999] },
    { segment: "thigh", share: 0.8, values: [1.0533, 0.0009, -0.395] },
    { segment: "thigh", share: 0.9, values: [1.068, 0.0986, -0.4384] },
    { segment: "thigh", share: 1, values: [1.1131, 0.1449, -1.0537] },
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
