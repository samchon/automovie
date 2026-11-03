import { AutoMovieHumanLegProfile } from "./AutoMovieHumanLegProfile";
import type { AutoMovieHumanLegStations } from "./AutoMovieHumanLegStations";

/**
 * The shank's the front of the anterior compartment beside the tibial crest sector of the leg's section: the arc between the
 * anterior guide (0 degrees) and the anterolateral guide (45 degrees), a
 * compartment built in the frame of its own chord (`AutoMovieHumanChordArc`):
 * the quintic Hermite arc of both guides' jets plus its own fullness, the
 * bulge normal to the chord at its middle, in units of the section's girth over
 * 2 pi, outward positive. The sector owns 33 of the section's 264 knot spans.
 */
export namespace AutoMovieHumanLegShankTibialisAnterior {
  /** Index of the sector in the section: it follows guide `j`. */
  export const INDEX: number = 0;

  /**
   * The landmark rows, `[fullness]`: the medians over the four reference
   * bodies f1, f2, m1 and m2 of the sector's bulge against its Hermite arc, on
   * horizontal sections of the left leg. The largest held-out deviation of a
   * person's fullness from the median of the other three is
   * 0.002 to 0.018.
   */
  export const ROWS: readonly AutoMovieHumanLegProfile.IRow[] = [
    { segment: "shank", share: 0.07, values: [0.0115] },
    { segment: "shank", share: 0.15, values: [-0.0028] },
    { segment: "shank", share: 0.25, values: [0.0049] },
    { segment: "shank", share: 0.35, values: [0.0094] },
    { segment: "shank", share: 0.5, values: [0.006] },
    { segment: "shank", share: 0.65, values: [0.0033] },
    { segment: "shank", share: 0.8, values: [0.0069] },
    { segment: "shank", share: 0.9, values: [0.0046] },
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
