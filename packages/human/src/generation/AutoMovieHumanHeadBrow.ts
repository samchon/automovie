import { AutoMovieHumanHeadWindow } from "./AutoMovieHumanHeadWindow";
import type { IAutoMovieHumanHeadEyeOpening } from "./IAutoMovieHumanHeadEyeOpening";
import type { IAutoMovieHumanHeadLayout } from "./IAutoMovieHumanHeadLayout";

/**
 * The brow ridge (the supraorbital arch) of one eye as a relief window along
 * the orbit's upper margin: the bony arch over the eye, running from the
 * glabella toward the lateral orbital rim. Its frame is the eye's: centre over
 * the middle of the fissure at the glabella's height, the long extent the
 * fissure's own length. One construction serves both sides; the right is
 * the left read by `|z|` with the right eye's own opening.
 *
 * Reads: the glabella and nasion heights, and the eye's opening (its place
 * and length). Publishes a height in millimetres. Declared with its frame and
 * inputs, amplitude zero ({@link AMPLITUDE}): the feminine brow stays small
 * and the shape is derived by the piece's owner.
 */
export namespace AutoMovieHumanHeadBrow {
  /** What the brow reads. */
  export interface IInput {
    /** The skeleton's landmarks: the glabella and the nasion. */
    plan: Pick<IAutoMovieHumanHeadLayout, "landmarks">;

    /** This eye's opening: its centre's distance from the midline and its length. */
    eye: Pick<IAutoMovieHumanHeadEyeOpening, "place" | "length">;
  }

  /**
   * Where the window stands.
   *
   * @param input What the brow reads.
   * @returns The window's place.
   */
  export function place(input: IInput): AutoMovieHumanHeadWindow.IPlace {
    const g: number = input.plan.landmarks.glabella[1];
    const n: number = input.plan.landmarks.nasion[1];
    return {
      y: g,
      z: input.eye.place,
      halfY: REACH * (g - n),
      halfZ: input.eye.length / 2,
      amplitude: AMPLITUDE,
    };
  }

  /**
   * Height of the ridge at a point.
   *
   * @param input What the brow reads.
   * @param y Height of the point.
   * @param a Distance of the point from the midline, `|z|`.
   * @returns Height in millimetres.
   */
  export function height(input: IInput, y: number, a: number): number {
    return AutoMovieHumanHeadWindow.height(place(input), y, a);
  }

  /** Height of the crest over the base surface, millimetres: zero until the piece's owner derives it. */
  export const AMPLITUDE: number = 0;

  /** Share of the glabella-to-nasion height that is the window's half height: a placeholder extent. */
  export const REACH: number = 0.6;
}
