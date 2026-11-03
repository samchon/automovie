import { AutoMovieHumanTrunkFeatureFrame } from "./AutoMovieHumanTrunkFeatureFrame";

/**
 * The spinal furrow's own frame: its centre is the back midline at the
 * furrow's middle height (the spinous line, Gray 1918), its axis the back
 * wall's outward normal there, which is backward on the midline. The erector
 * columns on either side belong to the trunk's sections; the furrow between
 * them is its own piece.
 */
export namespace AutoMovieHumanSpinalFrame {
  /**
   * The furrow's frame.
   *
   * @param middle The furrow's middle height, mm.
   * @param back The back midline's forward place at that height, mm.
   * @returns The frame, axis backward, on the midline.
   */
  export function create(middle: number, back: number): AutoMovieHumanTrunkFeatureFrame.IFrame {
    return AutoMovieHumanTrunkFeatureFrame.create([back, middle, 0], [-1, 0, 0]);
  }
}
