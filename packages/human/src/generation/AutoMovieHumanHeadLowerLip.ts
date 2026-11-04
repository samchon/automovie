import { AutoMovieHumanHeadLipFrame } from "./AutoMovieHumanHeadLipFrame";
import type { IAutoMovieHumanHeadLayout } from "./IAutoMovieHumanHeadLayout";

/**
 * The lower lip as a relief window in the lips' frame: the lower vermilion
 * below the contact line, as high as the input at the midline and falling to
 * the cheilion as a power of the share `1 - u^2` (0.65, the border's own
 * roundness), and its swelling.
 *
 * Reads: the skeleton's lower vermilion height, scale and forward lead over
 * the face, and the lips' frame. Publishes the border's height under the
 * contact line and the swelling's height, millimetres.
 */
export namespace AutoMovieHumanHeadLowerLip {
  /**
   * Height of the lower vermilion under the contact line.
   *
   * @param plan The skeleton's lower vermilion height.
   * @param m The lips' fall-off toward the corners.
   * @returns Height in millimetres.
   */
  export function border(plan: Pick<IAutoMovieHumanHeadLayout, "lowerLip">, m: number): number {
    return plan.lowerLip * m ** 0.65;
  }

  /**
   * Height of the lower lip's swelling at a point.
   *
   * @param plan The landmark skeleton.
   * @param frame The lips' measures at the point's distance from the midline.
   * @param y Height of the point.
   * @returns Height in millimetres.
   */
  export function bulge(
    plan: Pick<IAutoMovieHumanHeadLayout, "lowerLip" | "lips" | "scale">,
    frame: AutoMovieHumanHeadLipFrame.IFrame,
    y: number,
  ): number {
    const lower: number = border(plan, frame.m);
    return AutoMovieHumanHeadLipFrame.bulge(plan.scale, frame.m, y, frame.mid - lower / 2, lower, plan.lips[1]);
  }
}
