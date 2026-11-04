import { AutoMovieHumanHeadMath } from "./AutoMovieHumanHeadMath";
import type { AutoMovieHumanHeadNoseFrame } from "./AutoMovieHumanHeadNoseFrame";
import type { AutoMovieHumanHeadPrior } from "./AutoMovieHumanHeadPrior";

/**
 * The alar lobules as a relief window in the nose's frame: two rounded wings,
 * each a two-dimensional bell centred at the prior's share of the nose's half
 * width and of its span over the subnasale, shallower below than above. The
 * two lobes together are smooth across the midline. One lobe is written for the
 * left side by its signed distance from the midline; the other is its
 * reflection (the distance negated), so there is one construction and a
 * declared reflection.
 *
 * Reads: the nose's frame at the point and the prior's `ala` row: height gain,
 * centre across (in nose half widths), centre up (in spans), half height above
 * and below (in spans) and half width (in half widths). Publishes a height in
 * millimetres.
 */
export namespace AutoMovieHumanHeadNoseAla {
  /**
   * Height of both lobes at a distance from the midline.
   *
   * @param frame The nose's measures at the point's height.
   * @param ala The prior's alar row.
   * @param y Height of the point.
   * @param a Distance of the point from the midline, `|z|`.
   * @returns Height in millimetres.
   */
  export function lobes(
    frame: AutoMovieHumanHeadNoseFrame.IFrame,
    ala: AutoMovieHumanHeadPrior.IFace["ala"],
    y: number,
    a: number,
  ): number {
    const half: number = (y < frame.lobeY ? ala[4]! : ala[3]!) * frame.span;
    const lobe = (d: number): number =>
      AutoMovieHumanHeadMath.bell2(
        (y - frame.lobeY) / half,
        (d - ala[1]! * frame.width) / (ala[5]! * frame.width),
      );
    return ((ala[0]! * frame.width) / 14) * (lobe(a) + lobe(-a));
  }
}
