import { AutoMovieHumanNaturalSpline } from "../lofting/AutoMovieHumanNaturalSpline";
import { AutoMovieHumanHeadMath } from "./AutoMovieHumanHeadMath";
import type { IAutoMovieHumanHeadLayout } from "./IAutoMovieHumanHeadLayout";

/**
 * The median front profile P as one curve: the vault's ellipse about the
 * glabella's height plus a natural spline of the landmarks' departures from
 * it, the forward place of the skin on the midsagittal plane at a height, from
 * the vertex to the menton (head frame, calibration millimetres). The landmarks
 * own its knots; the nose, lips and chin are windows over it.
 */
export namespace AutoMovieHumanHeadMedianProfile {
  /**
   * The midline profile's forward place at a height: the vault's ellipse plus
   * the landmarks' spline.
   */
  export function profileAt(plan: IAutoMovieHumanHeadLayout, y: number): number {
    const g: number = plan.landmarks.glabella[1];
    return (
      plan.centre +
      (plan.length / 2) * AutoMovieHumanHeadMath.crownShare(y, g, plan.vertex - g) +
      AutoMovieHumanNaturalSpline.evaluate(plan.profile, y)
    );
  }
}
