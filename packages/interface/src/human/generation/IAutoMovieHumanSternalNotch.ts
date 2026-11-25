/**
 * The height-to-forward-position profile callback supplied to notch-frame
 * construction. Runtime construction and admission remain with
 * AutoMovieHumanSternalNotch in Human.
 */
export namespace IAutoMovieHumanSternalNotch {
  /**
   * Front-midline forward coordinate at world height y, both in millimetres in
   * the trunk frame. The notch-frame constructor reads this profile beneath the
   * neck ring.
   */
  export type FrameFront = (y: number) => number;
}
