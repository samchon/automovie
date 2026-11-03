import { AutoMovieHumanHeadLipFrame } from "./AutoMovieHumanHeadLipFrame";
import { AutoMovieHumanHeadMath } from "./AutoMovieHumanHeadMath";
import type { IAutoMovieHumanHeadLayout } from "./IAutoMovieHumanHeadLayout";

/**
 * The upper lip as a relief window in the lips' frame: the upper vermilion's
 * border above the contact line, and its swelling. The border stands at the
 * input height at the midline, where labrale superius is (Farkas defines it as
 * the midpoint of the upper vermilion line), the Cupid's bow's peaks a fifth
 * higher at the philtral columns (0.13 of the half mouth width out), falling
 * to the cheilion. A dip below the input read 0.82 of it, so the bow's dip sits
 * at the input and the peaks above it.
 *
 * Reads: the skeleton's upper vermilion height, scale and forward lead over
 * the face, and the lips' frame. Publishes the border's height over the
 * contact line and the swelling's height, millimetres.
 */
export namespace AutoMovieHumanHeadUpperLip {
  /**
   * Height of the upper vermilion's border over the contact line at a share of
   * the half mouth width.
   *
   * @param plan The skeleton's upper vermilion height.
   * @param u Distance from the midline over the half mouth width.
   * @returns Height in millimetres, zero at the cheilion.
   */
  export function border(plan: Pick<IAutoMovieHumanHeadLayout, "upperLip">, u: number): number {
    const m: number = Math.max(0, 1 - u * u);
    return (plan.upperLip * m ** 0.55 * (1 - BOW * AutoMovieHumanHeadMath.bell(u / 0.13))) / (1 - BOW);
  }

  /**
   * Height of the upper lip's swelling at a point.
   *
   * @param plan The landmark skeleton.
   * @param frame The lips' measures at the point's distance from the midline.
   * @param y Height of the point.
   * @returns Height in millimetres.
   */
  export function bulge(
    plan: Pick<IAutoMovieHumanHeadLayout, "upperLip" | "lips" | "scale">,
    frame: AutoMovieHumanHeadLipFrame.IFrame,
    y: number,
  ): number {
    const upper: number = border(plan, frame.u);
    return AutoMovieHumanHeadLipFrame.bulge(plan.scale, frame.m, y, frame.mid + upper / 2, upper, plan.lips[0]);
  }

  /** Depth of the Cupid's bow's dip at the midline, per the border's height there (Farkas's labrale superius is the dip's own height). */
  export const BOW: number = 0.18;
}
