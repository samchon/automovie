import { AutoMovieHumanHeadMath } from "./AutoMovieHumanHeadMath";
import type { AutoMovieHumanHeadPrior } from "./AutoMovieHumanHeadPrior";
import type { IAutoMovieHumanHeadLayout } from "./IAutoMovieHumanHeadLayout";

/**
 * The philtrum as a groove window on the midline between the subnasale and the
 * upper vermilion's top: a bell across the midline, switched on between the
 * two landmarks by smoothsteps three millimetres wide at each end, so it ends
 * at the nose's base and at the lip's border without a seam. Its centre is the
 * midline; its extent along the face is the person's own subnasale and stomion
 * plus upper vermilion height.
 *
 * Reads: the skeleton's subnasale, stomion, upper vermilion height and scale,
 * and the prior's philtrum row (depth and half width, millimetres at the
 * specimen's scale). Publishes a depth in millimetres, positive inward.
 */
export namespace AutoMovieHumanHeadPhiltrum {
  /**
   * Depth of the groove at a point.
   *
   * @param plan The landmark skeleton.
   * @param face The prior's philtrum row.
   * @param y Height of the point.
   * @param a Distance of the point from the midline, `|z|`.
   * @returns Depth in millimetres, positive inward.
   */
  export function depth(
    plan: Pick<IAutoMovieHumanHeadLayout, "subnasale" | "stomion" | "upperLip" | "scale">,
    face: Pick<AutoMovieHumanHeadPrior.IFace, "philtrum">,
    y: number,
    a: number,
  ): number {
    const k: number = plan.scale;
    const lipTop: number = plan.stomion + plan.upperLip;
    const between: number =
      AutoMovieHumanHeadMath.smooth((plan.subnasale - y) / (3 * k)) *
      AutoMovieHumanHeadMath.smooth((y - lipTop + 3 * k) / (3 * k));
    return (
      face.philtrum[0]! *
      k *
      between *
      AutoMovieHumanHeadMath.bell(a / (face.philtrum[1]! * k))
    );
  }
}
