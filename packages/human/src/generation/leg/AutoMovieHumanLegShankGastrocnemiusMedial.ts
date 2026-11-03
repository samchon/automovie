import { AutoMovieHumanLegProfile } from "./AutoMovieHumanLegProfile";
import type { AutoMovieHumanLegStations } from "./AutoMovieHumanLegStations";

/**
 * The shank's the medial head of the gastrocnemius, the lower and larger sector of the leg's section: the arc between the
 * posterior guide (180 degrees) and the posteromedial guide (225 degrees), a
 * compartment built in the frame of its own chord (`AutoMovieHumanChordArc`):
 * the quintic Hermite arc of both guides' jets plus its own fullness, the
 * bulge normal to the chord at its middle, in units of the section's girth over
 * 2 pi, outward positive. The sector owns 33 of the section's 264 knot spans.
 */
export namespace AutoMovieHumanLegShankGastrocnemiusMedial {
  /** Index of the sector in the section: it follows guide `j`. */
  export const INDEX: number = 4;

  /**
   * The landmark rows, `[fullness]`: the medians over the four reference
   * bodies f1, f2, m1 and m2 of the sector's bulge against its Hermite arc, on
   * horizontal sections of the left leg. The largest held-out deviation of a
   * person's fullness from the median of the other three is
   * 0.002 to 0.0269.
   */
  export const ROWS: readonly AutoMovieHumanLegProfile.IRow[] = [
    { segment: "shank", share: 0.07, values: [-0.004] },
    { segment: "shank", share: 0.15, values: [0.0051] },
    { segment: "shank", share: 0.25, values: [0.0034] },
    { segment: "shank", share: 0.35, values: [0.0034] },
    { segment: "shank", share: 0.5, values: [0] },
    { segment: "shank", share: 0.65, values: [0.0022] },
    { segment: "shank", share: 0.8, values: [0.0043] },
    { segment: "shank", share: 0.9, values: [0.015] },
  ];

  /**
   * The fullness along the shank's rows alone.
   *
   * @param bones The joints' heights, which place the rows.
   * @returns The fullness at a station, held at the end rows beyond them.
   */
  export function fullness(bones: AutoMovieHumanLegStations.IBones): AutoMovieHumanLegProfile.Channel {
    return AutoMovieHumanLegProfile.channel(ROWS, bones, 0);
  }
}
