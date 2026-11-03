import { AutoMovieHumanHeadMath } from "./AutoMovieHumanHeadMath";
import type { AutoMovieHumanHeadNoseFrame } from "./AutoMovieHumanHeadNoseFrame";
import type { AutoMovieHumanHeadPrior } from "./AutoMovieHumanHeadPrior";

/**
 * The nasal tip as a relief window centred on the pronasale in the nose's
 * frame: a flat-topped lobule (a quartic bell) of the tip's own lead, longer
 * below the tip than above it, as wide as a share of the nose's half width.
 * It shares the dorsum's axis, and the two meet at the tip by a soft maximum
 * (`AutoMovieHumanHeadNose`).
 *
 * Reads: the nose's frame at the point and the prior's tip-ball lengths
 * (below, above and across, in nose widths). Publishes a height in
 * millimetres that vanishes with its slopes away from the tip.
 */
export namespace AutoMovieHumanHeadNoseTip {
  /**
   * Height of the tip's lobule at a distance from the midline.
   *
   * @param frame The nose's measures at the point's height.
   * @param ball The prior's `tipBall`: the lobule's lengths under and over the tip and across.
   * @param a Distance of the point from the midline, `|z|`.
   * @returns Height in millimetres.
   */
  export function ball(
    frame: AutoMovieHumanHeadNoseFrame.IFrame,
    ball: AutoMovieHumanHeadPrior.IFace["tipBall"],
    a: number,
  ): number {
    return (
      frame.lead *
      AutoMovieHumanHeadMath.bell4(
        Math.hypot(
          frame.v / (frame.v < 0 ? ball[0]! : ball[1]!),
          a / (ball[2]! * frame.width),
        ),
      )
    );
  }
}
