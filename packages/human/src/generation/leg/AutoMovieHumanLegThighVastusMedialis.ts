import { AutoMovieHumanLegProfile } from "./AutoMovieHumanLegProfile";
import type { AutoMovieHumanLegStations } from "./AutoMovieHumanLegStations";

/**
 * The thigh's the vastus medialis sector of the leg's section: the arc between the
 * anteromedial guide (315 degrees) and the anterior guide (0 degrees), a
 * compartment built in the frame of its own chord (`AutoMovieHumanChordArc`):
 * the quintic Hermite arc of both guides' jets plus its own fullness, the
 * bulge normal to the chord at its middle, in units of the section's girth over
 * 2 pi, outward positive. The sector owns 33 of the section's 264 knot spans.
 */
export namespace AutoMovieHumanLegThighVastusMedialis {
  /** Index of the sector in the section: it follows guide `j`. */
  export const INDEX: number = 7;

  /**
   * The landmark rows, `[fullness]`: the medians over the four reference
   * bodies f1, f2, m1 and m2 of the sector's bulge against its Hermite arc, on
   * horizontal sections of the left leg. The largest held-out deviation of a
   * person's fullness from the median of the other three is
   * 0.0024 to 0.0129.
   */
  export const ROWS: readonly AutoMovieHumanLegProfile.IRow[] = [
    { segment: "thigh", share: 0.25, values: [-0.0012] },
    { segment: "thigh", share: 0.35, values: [-0.0027] },
    { segment: "thigh", share: 0.5, values: [0.0036] },
    { segment: "thigh", share: 0.65, values: [0.0059] },
    { segment: "thigh", share: 0.8, values: [0.0041] },
    { segment: "thigh", share: 0.9, values: [0.0031] },
    { segment: "thigh", share: 1, values: [0.0083] },
  ];

  /**
   * The fullness along the thigh's rows alone.
   *
   * @param bones The joints' heights, which place the rows.
   * @returns The fullness at a station, held at the end rows beyond them.
   */
  export function fullness(bones: AutoMovieHumanLegStations.IBones): AutoMovieHumanLegProfile.Channel {
    return AutoMovieHumanLegProfile.channel(ROWS, bones, 0);
  }
}
