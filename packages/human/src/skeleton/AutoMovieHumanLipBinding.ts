import type { IAutoMovieHumanBindingLips } from "./IAutoMovieHumanBindingLips";
import type { AutoMovieHumanSkeletonMath as Math3D } from "./AutoMovieHumanSkeletonMath";
import { AutoMovieHumanSkinStep } from "./AutoMovieHumanSkinStep";

/**
 * The lips piece: the jaw's share of a point by its side of the lips' contact
 * line.
 *
 * The skin is open along that line between the cheilia, so the share may jump
 * across it there and nowhere else. Over the middle half of the mouth a point
 * above the line is the head's and one below the jaw's whole. Toward the
 * cheilia a share of up to half crosses the line, fading over the cheek's
 * height away from it, so at a cheilion both sides hold half and the whole
 * skin past it is continuous with a level tangent: the opening narrows to its
 * corners as a parted mouth's does. A hand-over centred on the line itself,
 * narrow within the slit and widening past it, put the whole jaw's turn across
 * a few millimetres round each commissure, which stretched more than three
 * times under a 20 mm opening on every person.
 */
export namespace AutoMovieHumanLipBinding {
  /**
   * Share of the mouth's half width where the lips' narrow hand-over starts to
   * widen: the opening of a parted mouth narrows toward its corners, where the
   * lips meet.
   */
  export const CORNER_FROM: number = 0.5;

  /** Share of the mouth's half width where it has widened to the jaw's ramp: the cheilion. */
  export const CORNER_TO: number = 1;

  /**
   * The jaw's share of a point.
   *
   * @param lips The lips' contact line.
   * @param p The point, metres.
   * @returns The jaw's share, 0 to 1.
   */
  export function below(
    lips: IAutoMovieHumanBindingLips,
    p: Math3D.Vector,
  ): number {
    // The contact line's height at the point's share of the half width, read
    // between the line's samples.
    const u: number = Math.abs(p[2]) / lips.width;
    const k: number = Math.min(1, u) * (lips.contact.length - 1);
    const i: number = Math.min(lips.contact.length - 2, Math.floor(k));
    const f: number = k - i;
    const contact: number =
      lips.contact[i]! * (1 - f) + lips.contact[i + 1]! * f;
    const v: number = p[1] - contact;

    // A share of up to half crosses the line toward the corners, fading with
    // the point's height away from it.
    const crossing: number =
      0.5 *
      AutoMovieHumanSkinStep.rise(
        (u - CORNER_FROM) / (CORNER_TO - CORNER_FROM),
      ) *
      (1 - AutoMovieHumanSkinStep.rise(Math.abs(v) / lips.wide));
    return v >= 0 ? crossing : 1 - crossing;
  }
}
