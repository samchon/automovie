import type { AutoMovieHumanHeadPrior } from "./AutoMovieHumanHeadPrior";
import type { IAutoMovieHumanHeadLayout } from "./IAutoMovieHumanHeadLayout";

/**
 * The nose's base: the surface the nose stands on, rising forward from the lip
 * at the columella's angle. It trims the tip's lobule and the alae by a
 * harmonic union (`AutoMovieHumanHeadNose`) so the tip, the columella and the
 * alar rims turn into it over radii in proportion to their own size; a level
 * shelf cut across the nose turned at 1 mm and read from three quarters as one
 * slot.
 *
 * Reads: the skeleton's subnasale, nasion and tip heights, nose width,
 * columella angle and the base's rounding radius, and the prior's rise.
 * Publishes the base's height and slope across, and the filleted height above
 * it.
 */
export namespace AutoMovieHumanHeadNoseBase {
  /** What the base reads. */
  export type IInput = Pick<
    IAutoMovieHumanHeadLayout,
    "subnasale" | "nasion" | "tip" | "noseWidth" | "columella" | "round"
  >;

  /**
   * Height where the nose's base meets the face, at a distance from the
   * midline, and its slope across: the subnasale at the columella, a little
   * higher under the alar rims, and level past them. A base that fell away past
   * the wing bent its line at 0.3 mm and kept the lobule's tail below it, whose
   * cut edge the trim then had to round.
   *
   * @param plan The landmark skeleton.
   * @param face The prior's face constants (the base's rise).
   * @param a Distance of the point from the midline, `|z|`.
   * @returns `[height, slope across]`.
   */
  export function line(
    plan: Pick<IInput, "subnasale" | "nasion" | "tip" | "noseWidth">,
    face: Pick<AutoMovieHumanHeadPrior.IFace, "underside">,
    a: number,
  ): [number, number] {
    const u: number = Math.min(1, a / plan.noseWidth);
    const rise: number = (plan.nasion - plan.tip) * face.underside[0]!;
    return [
      plan.subnasale + rise * u * u * (3 - 2 * u),
      (rise * 6 * u * (1 - u)) / plan.noseWidth,
    ];
  }

  /**
   * Height of the nose's base surface over the lip at a point: the lip and the
   * base plane joined by a circle of the base's rounding radius.
   *
   * @param plan The landmark skeleton.
   * @param face The prior's face constants.
   * @param y Height of the point.
   * @param a Distance of the point from the midline, `|z|`.
   * @returns Height in millimetres, zero under the base.
   */
  export function floor(
    plan: IInput,
    face: Pick<AutoMovieHumanHeadPrior.IFace, "underside">,
    y: number,
    a: number,
  ): number {
    const [base, fall] = line(plan, face, a);
    return filleted((y - base) / Math.hypot(1, fall), plan.columella, plan.round);
  }

  /**
   * Height of the nose's base over the lip at a distance above the base's line:
   * the lip and the base plane, rising forward at an angle, joined by a circle
   * of a radius tangent to both, the nose's own blend width, and a tail of
   * height h is cut where the circle has risen to h.
   *
   * @param above Distance above the base's line, millimetres.
   * @param angle The columella's angle, radians.
   * @param radius The circle's radius, millimetres.
   * @returns Height in millimetres.
   */
  export function filleted(above: number, angle: number, radius: number): number {
    const reach: number = radius / Math.tan(Math.PI / 4 + angle / 2);
    if (above <= -reach) return 0;
    if (above >= reach * Math.sin(angle)) return above / Math.tan(angle);
    return radius - Math.sqrt(Math.max(0, radius ** 2 - (above + reach) ** 2));
  }
}
