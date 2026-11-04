import { AutoMovieHumanHeadWindow } from "./AutoMovieHumanHeadWindow";
import type { IAutoMovieHumanHeadLayout } from "./IAutoMovieHumanHeadLayout";

/**
 * The malar eminence (the cheekbone's prominence) as a relief window on the
 * paramedian sector S2 under the orbit: the swelling of the zygomatic bone
 * where the orbit's lower rim runs into the arch. Its frame: centre at the
 * zygion's height and a share of the face's half width out, extents set by
 * the distance from the orbit to the zygion. One construction serves both
 * sides, the right read by `|z|`.
 *
 * Reads: the skeleton's zygion and half face width. Publishes a height in
 * millimetres. Declared with its frame and inputs, amplitude zero
 * ({@link AMPLITUDE}); the cheek's width itself is the face boundary's.
 */
export namespace AutoMovieHumanHeadCheek {
  /** What the cheek reads. */
  export type IInput = Pick<IAutoMovieHumanHeadLayout, "faceWidth" | "landmarks" | "eye">;

  /**
   * Where the window stands.
   *
   * @param plan The landmark skeleton.
   * @returns The window's place.
   */
  export function place(plan: IInput): AutoMovieHumanHeadWindow.IPlace {
    const reach: number = plan.eye - plan.landmarks.zygion[1];
    return {
      y: plan.landmarks.zygion[1] + 0.5 * reach,
      z: OUT * plan.faceWidth,
      halfY: 0.5 * reach,
      halfZ: SPAN * plan.faceWidth,
      amplitude: AMPLITUDE,
    };
  }

  /**
   * Height of the eminence at a point.
   *
   * @param plan The landmark skeleton.
   * @param y Height of the point.
   * @param a Distance of the point from the midline, `|z|`.
   * @returns Height in millimetres.
   */
  export function height(plan: IInput, y: number, a: number): number {
    return AutoMovieHumanHeadWindow.height(place(plan), y, a);
  }

  /** Height of the crest over the base surface, millimetres: zero until the piece's owner derives it. */
  export const AMPLITUDE: number = 0;

  /** Share of the half face width at which the eminence is centred: a placeholder placement. */
  export const OUT: number = 0.8;

  /** Share of the half face width that is the window's half width: a placeholder extent. */
  export const SPAN: number = 0.3;
}
