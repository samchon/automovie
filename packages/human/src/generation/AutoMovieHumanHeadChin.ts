import { AutoMovieHumanHeadWindow } from "./AutoMovieHumanHeadWindow";
import type { IAutoMovieHumanHeadLayout } from "./IAutoMovieHumanHeadLayout";

/**
 * The mental protuberance (the chin's bony prominence and its soft-tissue pad)
 * as a relief window on the median sector S1 below the lower lip: the
 * triangle of bone whose most anterior point is the pogonion. Its frame:
 * centre on the midline between the pogonion and the gnathion, extents set by
 * the distance from the sublabiale to the menton and by the mandible's half
 * width at the menton (a share of it, the chin's turn in plan).
 *
 * Reads: the skeleton's pogonion, menton and sublabiale heights, and the
 * half mandibular width. Publishes a height in millimetres. Declared with
 * its frame and inputs, amplitude zero ({@link AMPLITUDE}): the median
 * profile through the pogonion and the jaw's arch own the chin's outline.
 */
export namespace AutoMovieHumanHeadChin {
  /** What the chin reads. */
  export type IInput = Pick<IAutoMovieHumanHeadLayout, "menton" | "mandibularWidth" | "landmarks">;

  /**
   * Where the window stands.
   *
   * @param plan The landmark skeleton.
   * @returns The window's place.
   */
  export function place(plan: IInput): AutoMovieHumanHeadWindow.IPlace {
    const pg: number = plan.landmarks.pogonion[1];
    const me: number = plan.menton;
    return {
      y: (pg + me) / 2,
      z: 0,
      halfY: pg - me,
      halfZ: SPAN * plan.mandibularWidth,
      amplitude: AMPLITUDE,
    };
  }

  /**
   * Height of the protuberance at a point.
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

  /** Share of the half mandibular width that is the window's half width: a placeholder extent. */
  export const SPAN: number = 0.25;
}
