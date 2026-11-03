import { AutoMovieHumanHeadMath } from "./AutoMovieHumanHeadMath";
import type { AutoMovieHumanHeadNoseFrame } from "./AutoMovieHumanHeadNoseFrame";
import type { AutoMovieHumanHeadPrior } from "./AutoMovieHumanHeadPrior";

/**
 * The alar crease as a groove window: the line where each lobule sets back
 * into the cheek round its outer side. It is a bell in the distance from the
 * lobule's centre, measured in the lobule's own half height and half width, so
 * it follows the lobule when the nose is lengthened or widened, and it fades in
 * across the lobule's outer side (a smoothstep) so the groove does not cross
 * the dorsum.
 *
 * Reads: the nose's frame at the point, the prior's alar row and crease row
 * (depth, width and radius in lobule units) and the calibration scale.
 * Publishes a depth in millimetres, positive inward.
 */
export namespace AutoMovieHumanHeadNoseCrease {
  /**
   * Depth of the crease at a point.
   *
   * @param frame The nose's measures at the point's height.
   * @param face The prior's alar and crease rows.
   * @param scale Calibration millimetres per world millimetre.
   * @param y Height of the point.
   * @param a Distance of the point from the midline, `|z|`.
   * @returns Depth in millimetres, positive inward.
   */
  export function depth(
    frame: AutoMovieHumanHeadNoseFrame.IFrame,
    face: Pick<AutoMovieHumanHeadPrior.IFace, "ala" | "crease">,
    scale: number,
    y: number,
    a: number,
  ): number {
    const round: number = Math.hypot(
      (y - frame.lobeY) / (face.ala[3]! * frame.span),
      (a - face.ala[1]! * frame.width) / (face.ala[5]! * frame.width),
    );
    return (
      face.crease[0]! *
      scale *
      AutoMovieHumanHeadMath.bell((round - face.crease[2]!) / face.crease[1]!) *
      AutoMovieHumanHeadMath.smooth((a / frame.width - face.ala[1]!) / face.ala[5]!)
    );
  }
}
