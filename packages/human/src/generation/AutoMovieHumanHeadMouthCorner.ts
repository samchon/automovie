import { AutoMovieHumanHeadWindow } from "./AutoMovieHumanHeadWindow";
import type { IAutoMovieHumanHeadLayout } from "./IAutoMovieHumanHeadLayout";

/**
 * The mouth corner (the oral commissure, where the modiolus gathers the
 * muscles of the lips and cheek) as a relief window in the lips' frame: a
 * small swelling and fold at each cheilion, at the contact line's end. Its
 * frame: centre at the corner's height and half the mouth width from the
 * midline, extents a few millimetres of the specimen scale. One construction
 * serves both corners, the right read by `|z|`.
 *
 * Reads: the skeleton's stomion, half mouth width and scale. Publishes a
 * height in millimetres. Declared with its frame and inputs, amplitude zero
 * ({@link AMPLITUDE}): the contact line, the lips' fall-off to the corner and
 * the mouth's seam are owned by their own pieces.
 */
export namespace AutoMovieHumanHeadMouthCorner {
  /** What the corner reads. */
  export type IInput = Pick<IAutoMovieHumanHeadLayout, "stomion" | "mouthWidth" | "scale">;

  /**
   * Where the window stands.
   *
   * @param plan The landmark skeleton.
   * @returns The window's place.
   */
  export function place(plan: IInput): AutoMovieHumanHeadWindow.IPlace {
    return {
      y: plan.stomion + 1.2 * plan.scale,
      z: plan.mouthWidth,
      halfY: EXTENT * plan.scale,
      halfZ: EXTENT * plan.scale,
      amplitude: AMPLITUDE,
    };
  }

  /**
   * Height of the corner's swelling at a point.
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

  /** Half extent of the window along and across the face, millimetres of the specimen scale: a placeholder. */
  export const EXTENT: number = 4;
}
