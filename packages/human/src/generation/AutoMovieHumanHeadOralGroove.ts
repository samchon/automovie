import { AutoMovieHumanHeadLipFrame } from "./AutoMovieHumanHeadLipFrame";
import { AutoMovieHumanHeadMath } from "./AutoMovieHumanHeadMath";
import type { AutoMovieHumanHeadPrior } from "./AutoMovieHumanHeadPrior";
import type { IAutoMovieHumanHeadLayout } from "./IAutoMovieHumanHeadLayout";

/**
 * The oral fissure's groove between the lips, as a window along the contact
 * line: a bell across the contact line whose half width is the prior's plus the
 * rest gap, as deep as the prior's depth plus 0.4 of the gap, and faded out
 * toward the corners by a smoothstep that ends at 1.08 half mouth widths. The
 * mouth's own seam and interior (`AutoMovieHumanMouth`) lie behind it.
 *
 * Reads: the skeleton's rest gap and scale, the lips' frame and the prior's
 * fissure row. Publishes a depth in millimetres, positive inward.
 */
export namespace AutoMovieHumanHeadOralGroove {
  /**
   * Depth of the groove at a point.
   *
   * @param plan The skeleton's rest gap and scale.
   * @param face The prior's fissure row.
   * @param frame The lips' measures at the point's distance from the midline.
   * @param y Height of the point.
   * @returns Depth in millimetres, positive inward.
   */
  export function depth(
    plan: Pick<IAutoMovieHumanHeadLayout, "gap" | "scale">,
    face: Pick<AutoMovieHumanHeadPrior.IFace, "fissure">,
    frame: AutoMovieHumanHeadLipFrame.IFrame,
    y: number,
  ): number {
    const groove: number = face.fissure[1]! * plan.scale + plan.gap;
    return (
      (face.fissure[0]! * plan.scale + 0.4 * plan.gap) *
      AutoMovieHumanHeadMath.smooth((1.08 - frame.u) / 0.2) *
      AutoMovieHumanHeadMath.bell((y - frame.mid) / groove)
    );
  }
}
