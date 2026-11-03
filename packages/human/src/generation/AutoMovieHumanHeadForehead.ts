import { AutoMovieHumanHeadWindow } from "./AutoMovieHumanHeadWindow";
import type { IAutoMovieHumanHeadLayout } from "./IAutoMovieHumanHeadLayout";

/**
 * The forehead's frontal eminence as a relief window on the median sector S1
 * over the glabella: the gentle swelling of the frontal bone either side of
 * the midline between the glabella and the hairline. Its frame is the
 * forehead's own: centre on the midline at a share of the vault's height over
 * the glabella, extents set by the forehead's height and the minimum frontal
 * width (frontotemporale to frontotemporale), the axis the forehead's normal.
 *
 * Reads: the skeleton's vertex and glabella heights and half frontal width.
 * Publishes a height in millimetres. The window is declared with its frame and
 * inputs and its amplitude is zero ({@link AMPLITUDE}): its shape is derived
 * from the references' foreheads by the piece's owner, and until then the
 * median profile alone draws the forehead.
 */
export namespace AutoMovieHumanHeadForehead {
  /** What the forehead reads. */
  export type IInput = Pick<
    IAutoMovieHumanHeadLayout,
    "vertex" | "frontalWidth" | "landmarks"
  >;

  /**
   * Where the window stands.
   *
   * @param plan The landmark skeleton.
   * @returns The window's place.
   */
  export function place(plan: IInput): AutoMovieHumanHeadWindow.IPlace {
    const g: number = plan.landmarks.glabella[1];
    const top: number = plan.vertex - g;
    return {
      y: g + CENTRE * top,
      z: 0,
      halfY: REACH * top,
      halfZ: plan.frontalWidth,
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

  /** Height of the crest over the base surface, millimetres: zero until the piece's owner derives it from the references. */
  export const AMPLITUDE: number = 0;

  /** Share of the vault's height over the glabella at which the eminence is centred: a placeholder placement, not a measurement. */
  export const CENTRE: number = 0.25;

  /** Share of the same height that is the window's half height: a placeholder extent, not a measurement. */
  export const REACH: number = 0.2;
}
